import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Unified real-time hook for zakazi data with multi-cache support
export const useRealtimeZakazi = (
  queryKey: string[] = ['zakazi'], 
  additionalQueryKeys: string[][] = []
) => {
  const queryClient = useQueryClient();

  const { data: zakazi, isLoading, isFetching, refetch } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      console.log(`Fetching zakazi data for ${queryKey.join('-')}...`);
      const { data, error } = await supabase
        .from('zakazi')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching zakazi:', error);
        throw error;
      }
      console.log('Zakazi data fetched:', data?.length, 'records');
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    placeholderData: [], // Keep empty array to prevent flashing
  });

  // Update all caches when data changes
  const updateAllCaches = (updateFn: (oldData: any) => any) => {
    const allQueryKeys = [queryKey, ...additionalQueryKeys];
    
    allQueryKeys.forEach(key => {
      queryClient.setQueryData(key, updateFn);
    });
  };

  // Unified real-time subscription
  useEffect(() => {
    const channelName = `zakazi-realtime-unified`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zakazi'
        },
        (payload) => {
          console.log('Zakazi table changed:', payload);
          
          // Update all registered caches simultaneously
          updateAllCaches((oldData: any) => {
            if (!oldData) return [];
            
            switch (payload.eventType) {
              case 'INSERT':
                console.log('Adding new order to all caches');
                return [payload.new, ...oldData];
              case 'UPDATE':
                console.log('Updating order in all caches');
                return oldData.map((item: any) => 
                  item.uuid_zakaza === payload.new.uuid_zakaza ? payload.new : item
                );
              case 'DELETE':
                console.log('Removing order from all caches');
                return oldData.filter((item: any) => 
                  item.uuid_zakaza !== payload.old.uuid_zakaza
                );
              default:
                return oldData;
            }
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up unified zakazi channel');
      supabase.removeChannel(channel);
    };
  }, [queryClient, additionalQueryKeys.length]); // Re-subscribe when additional keys change

  return {
    data: zakazi,
    isLoading,
    isFetching,
    refetch
  };
};