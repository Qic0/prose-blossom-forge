import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';

interface UserPresence {
  user_id: string;
  full_name: string;
  online_at: string;
  status: 'online' | 'offline';
}

type UserRole = Database['public']['Enums']['user_role'];

interface UserWithRole extends User {
  role?: UserRole;
  full_name?: string;
  avatar_url?: string;
  status?: 'online' | 'offline';
  last_seen?: string;
}

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isDispatcher: boolean;
  onlineUsers: UserPresence[];
  isUserOnline: (userId: string) => boolean;
  getUserStatus: (userId: string) => 'online' | 'offline';
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  refreshOnlineUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('role, full_name, avatar_url, status, last_seen')
        .eq('uuid_user', userId)
        .single();
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Set up auth state listener and initial session
  useEffect(() => {
    let initialSessionChecked = false;

    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      
      if (session?.user) {
        // Load user profile for initial session
        fetchUserProfile(session.user.id).then(profile => {
          if (profile) {
            const userWithRole = {
              ...session.user,
              role: profile.role,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              status: profile.status,
              last_seen: profile.last_seen
            };
            setUser(userWithRole);
            
            // Redirect dispatcher to their dashboard
            if (profile.role === 'dispatcher') {
              navigate('/dispatcher', { replace: true });
            }
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
      
      initialSessionChecked = true;
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip initial SIGNED_IN event if we already checked session
        if (event === 'SIGNED_IN' && !initialSessionChecked) {
          return;
        }
        
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);

        if (session?.user) {
          setTimeout(async () => {
            try {
              const profile = await fetchUserProfile(session.user.id);
              if (profile) {
                const userWithRole = {
                  ...session.user,
                  role: profile.role,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url,
                  status: profile.status,
                  last_seen: profile.last_seen
                };
                setUser(userWithRole);
                
                // Redirect dispatcher on login
                if (event === 'SIGNED_IN' && profile.role === 'dispatcher') {
                  navigate('/dispatcher', { replace: true });
                }
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Database-based online tracking with realtime updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const setupOnlineTracking = async () => {
      setConnectionStatus('connecting');
      
      try {
        // Set user online immediately
        await supabase.rpc('set_user_online', { user_uuid: session.user.id });
        
        // Fetch initial online users
        const fetchOnlineUsers = async () => {
          const { data } = await supabase
            .from('users')
            .select('uuid_user, full_name, status, last_seen')
            .eq('status', 'online');
          
          if (data) {
            const presenceData: UserPresence[] = data.map(user => ({
              user_id: user.uuid_user,
              full_name: user.full_name,
              online_at: user.last_seen || new Date().toISOString(),
              status: user.status as 'online' | 'offline'
            }));
            
            setOnlineUsers(presenceData);
          }
        };

        await fetchOnlineUsers();
        setConnectionStatus('connected');

        // Set up realtime subscription for status changes
        const channel = supabase
          .channel('user-status-updates', {
            config: {
              broadcast: { self: false },
              presence: { key: 'user_id' }
            }
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
              filter: 'status=in.(online,offline)'
            },
            (payload) => {
              // Refresh online users when any user status changes
              fetchOnlineUsers();
            }
          )
          .subscribe();

        // Update activity every 30 seconds and refresh online users
        const intervalId = setInterval(async () => {
          try {
            await supabase.rpc('update_user_activity', { user_uuid: session.user.id });
            
            // Проверяем всех пользователей и обновляем статус на offline если последняя активность > 1 минуты
            const { data: allUsers } = await supabase
              .from('users')
              .select('uuid_user, last_seen, status');
            
            if (allUsers) {
              const now = new Date().getTime();
              for (const user of allUsers) {
                const lastSeen = user.last_seen ? new Date(user.last_seen).getTime() : 0;
                const diffInMinutes = (now - lastSeen) / (1000 * 60);
                
                // Если прошло больше минуты и статус онлайн - обновляем на офлайн
                if (diffInMinutes > 1 && user.status === 'online') {
                  await supabase.rpc('set_user_offline', { user_uuid: user.uuid_user });
                }
              }
            }
            
            // Also refresh online users list to catch any missed updates
            await fetchOnlineUsers();
          } catch (error) {
            console.error('Error updating user activity:', error);
            setConnectionStatus('disconnected');
          }
        }, 30000);

        // Handle window/tab close - set user offline
        const handleBeforeUnload = async () => {
          try {
            await supabase.rpc('set_user_offline', { user_uuid: session.user.id });
          } catch (error) {
            console.error('Error on before unload:', error);
          }
        };

        // Handle visibility change (when user switches tabs)
        const handleVisibilityChange = async () => {
          if (document.hidden) {
            // User switched to another tab - keep online but update last_seen
            try {
              await supabase.rpc('update_user_activity', { user_uuid: session.user.id });
            } catch (error) {
              console.error('Error on visibility change:', error);
            }
          } else {
            // User came back to the tab, ensure they're online
            try {
              await supabase.rpc('set_user_online', { user_uuid: session.user.id });
              await fetchOnlineUsers();
              setConnectionStatus('connected');
            } catch (error) {
              console.error('Error on tab focus:', error);
            }
          }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          clearInterval(intervalId);
          window.removeEventListener('beforeunload', handleBeforeUnload);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          supabase.removeChannel(channel);
          // Set user offline when cleanup
          supabase.rpc('set_user_offline', { user_uuid: session.user.id });
        };
      } catch (error) {
        console.error('Error setting up online tracking:', error);
        setConnectionStatus('disconnected');
      }
    };

    const cleanup = setupOnlineTracking();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [session?.user?.id]);

  const signOut = async () => {
    try {
      // Set user offline before signing out
      if (session?.user?.id) {
        await supabase.rpc('set_user_offline', { user_uuid: session.user.id });
      }
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setOnlineUsers([]);
      setConnectionStatus('disconnected');
      
      // Clear localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear state even on error
      setUser(null);
      setSession(null);
      setOnlineUsers([]);
    }
    // Убираем принудительное перенаправление - пусть React Router обработает это
  };

  // Presence functions
  const isUserOnline = (userId: string): boolean => {
    const user = onlineUsers.find(u => u.user_id === userId);
    if (!user) return false;
    
    // Проверяем, была ли активность более минуты назад
    const lastSeen = new Date(user.online_at).getTime();
    const now = new Date().getTime();
    const diffInMinutes = (now - lastSeen) / (1000 * 60);
    
    return diffInMinutes <= 1 && user.status === 'online';
  };

  const getUserStatus = (userId: string): 'online' | 'offline' => {
    const onlineUser = onlineUsers.find(user => user.user_id === userId);
    if (!onlineUser) return 'offline';
    
    // Проверяем, была ли активность более минуты назад
    const lastSeen = new Date(onlineUser.online_at).getTime();
    const now = new Date().getTime();
    const diffInMinutes = (now - lastSeen) / (1000 * 60);
    
    return diffInMinutes > 1 ? 'offline' : (onlineUser.status || 'offline');
  };

  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher';

  const refreshOnlineUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('uuid_user, full_name, status, last_seen')
      .eq('status', 'online');
    
    if (data) {
      const presenceData: UserPresence[] = data.map(user => ({
        user_id: user.uuid_user,
        full_name: user.full_name,
        online_at: user.last_seen || new Date().toISOString(),
        status: user.status as 'online' | 'offline'
      }));
      
      setOnlineUsers(presenceData);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    isAdmin,
    isDispatcher,
    onlineUsers,
    isUserOnline,
    getUserStatus,
    connectionStatus,
    refreshOnlineUsers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
