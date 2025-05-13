import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconLogout, IconUser } from "@tabler/icons-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/initials/svg?seed=';

export function NavUser({ user, isLoading }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  }, [logout, navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setShowLogoutDialog(true);
    }
  }, []);

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <div className="flex items-center gap-2" role="status" aria-label="Loading user information">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return null;
  }

  const avatarUrl = user.avatar || `${DEFAULT_AVATAR}${encodeURIComponent(user.name)}`;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link
            to="/profile"
            className="flex items-center gap-2"
            aria-label={`View ${user.name}'s profile`}
          >
            <img
              src={avatarUrl}
              alt={`${user.name}'s avatar`}
              className="h-8 w-8 rounded-full"
              onError={(e) => {
                console.error('Failed to load avatar');
                e.target.src = `${DEFAULT_AVATAR}${encodeURIComponent(user.name)}`;
                toast.error('Failed to load avatar');
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogTrigger asChild>
            <SidebarMenuButton
              onKeyDown={handleKeyDown}
              className="flex items-center gap-2"
              aria-label="Logout"
              disabled={isLoggingOut}
            >
              <IconLogout className={`h-5 w-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </SidebarMenuButton>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to login again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

NavUser.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }),
  isLoading: PropTypes.bool,
};

NavUser.defaultProps = {
  isLoading: false,
};
