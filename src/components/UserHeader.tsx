import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { useIsMobile } from '@/hooks/use-mobile';

const UserHeader = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isMobile = useIsMobile();

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {isMobile ? (
        // Мобильная версия: имя + аватар
        <>
          <span className={`text-sm font-medium transition-colors duration-300 ${isHomePage ? "text-white" : "text-foreground"}`}>
            {user.full_name?.split(' ')[0] || 'Пользователь'}
          </span>
        </>
      ) : (
        // Десктопная версия: роль
        <span className={`text-sm transition-colors duration-300 ${isHomePage ? "text-white" : "text-muted-foreground"}`}>
          {isAdmin ? 'Администратор' : 'Сотрудник'}
        </span>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.full_name || ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium leading-none">
              {user.full_name || user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-2"
              onClick={() => setIsProfileDialogOpen(true)}
            >
              <User className="mr-2 h-4 w-4" />
              Профиль
            </Button>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-auto p-2" 
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <UserProfileDialog 
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />
    </div>
  );
};

export default UserHeader;