
"use client";

import Link from 'next/link';
import { Bell, Settings2, CheckCheck } from 'lucide-react';
import type { Notification } from '@/types';
import { NotificationItem } from './notification-item';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } from '@/services/notification-api';
import { useCurrentUser } from '@/hooks/use-current-user';


export function NotificationDropdown() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUser = useCurrentUser();

  const { data: notificationsData, isLoading: isLoadingNotifications, error: notificationsError } = useQuery<Notification[], Error>({
    queryKey: ['myNotifications'],
    queryFn: () => getMyNotifications(0, 20), // Fetch latest 20 notifications
    enabled: !!currentUser, // Only run if user is logged in
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  const { data: unreadCountData, isLoading: isLoadingUnreadCount } = useQuery<{ count: number }, Error>({
    queryKey: ['unreadNotificationCount'],
    queryFn: getUnreadNotificationCount,
    enabled: !!currentUser,
    staleTime: 1000 * 60, // Cache for 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
  
  const unreadCount = unreadCountData?.count ?? notificationsData?.filter(n => !n.read).length ?? 0;


  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (data, notificationId) => {
      toast({ title: "Notification Marked Read", description: data?.message });
      queryClient.invalidateQueries({ queryKey: ['myNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (data) => {
      toast({ title: "All Notifications Marked Read", description: data?.message });
      queryClient.invalidateQueries({ queryKey: ['myNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleNotificationClick = (notificationId: number, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate(notificationId);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllReadMutation.mutate();
    }
  };

  const isLoading = isLoadingNotifications || (currentUser && isLoadingUnreadCount);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-md text-foreground/70 hover:text-foreground relative" aria-label="Notifications">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && !isLoadingUnreadCount && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
            <DropdownMenuLabel className="p-0 text-base font-semibold">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && !isLoadingUnreadCount && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {unreadCount} New
                </span>
            )}
             <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0 || markAllReadMutation.isPending}>
                <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
            </Button>
        </div>
        
        {isLoading && (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && notificationsError && (
            <p className="text-sm text-destructive text-center py-8">Error loading notifications.</p>
        )}

        {!isLoading && !notificationsError && (!notificationsData || notificationsData.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">No new notifications.</p>
        )}

        {!isLoading && !notificationsError && notificationsData && notificationsData.length > 0 && (
          <ScrollArea className="h-[300px] sm:h-[400px]">
            <div className="divide-y divide-border/50">
                {notificationsData.map((notif) => (
                <NotificationItem key={notif.id} notification={notif} onNotificationClick={handleNotificationClick} />
                ))}
            </div>
          </ScrollArea>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center py-2">
          <Link href="#" className="text-sm text-primary hover:underline">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
