
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Metadata } from 'next'; // Keep for potential static generation hints
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent
} from '@/components/ui/sidebar';
import { AdminSidebarContent } from '@/components/admin/admin-sidebar-content';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { Home, Loader2 } from 'lucide-react';
import { useCurrentUser, currentUserQueryKey } from '@/hooks/use-current-user';
import { useIsFetching } from '@tanstack/react-query';
import type { CurrentUser } from '@/types';

// export const metadata: Metadata = { // Not easily usable in client component for dynamic title
//   title: {
//     default: `Admin Panel - ${APP_NAME}`,
//     template: `%s | Admin - ${APP_NAME}`,
//   },
//   description: `Admin panel for ${APP_NAME}.`,
// };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUserData = useCurrentUser();
  const router = useRouter();
  const isFetchingCurrentUser = useIsFetching({ queryKey: currentUserQueryKey });

  useEffect(() => {
    if (typeof document !== 'undefined') {
        document.title = `Admin Panel - ${APP_NAME}`;
    }
    if (!isFetchingCurrentUser) {
      if (currentUserData === null) {
        router.push('/login?redirect=/admin');
      } else if (currentUserData && !currentUserData.is_admin) {
        router.push('/'); // Or a specific "access denied" page
      }
    }
  }, [currentUserData, isFetchingCurrentUser, router]);

  if (isFetchingCurrentUser || currentUserData === undefined ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Admin Panel...</p>
      </div>
    );
  }
  
  if (!currentUserData || (currentUserData && !currentUserData.is_admin)) {
    // This should ideally not be reached if redirection works,
    // but acts as a fallback to prevent rendering content.
    // It handles the case where currentUserData is null OR user is not an admin.
    return null; 
  }

  // At this point, currentUserData is confirmed to be CurrentUser and an admin.
  // Assign to a new constant to help TypeScript with type narrowing.
  const adminUser: CurrentUser = currentUserData;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
        <SidebarHeader className="p-3 flex items-center justify-between h-16 border-b">
          <Logo 
            size="medium" 
            className="group-data-[collapsible=icon]:hidden" 
            imageUrl="http://localhost:8000/static/logo/Lifegram.png" 
            text="Lifegram"
            imgAlt="Admin Panel Logo"
          />
          <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
             <SidebarTrigger className="hidden md:block" />
          </div>
        </SidebarHeader>
        
        <AdminSidebarContent />
        
        <SidebarFooter className="p-2 mt-auto border-t">
          <div className="flex items-center p-2 gap-2 group-data-[collapsible=icon]:justify-center">
            <UserAvatar user={adminUser} size="small" />
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold">{adminUser.username}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-col flex-1 min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:justify-end">
          <SidebarTrigger className="md:hidden mr-auto" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" /> Exit Admin
              </Link>
            </Button>
          </div>
        </header>
        <SidebarInset>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/30">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
