
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Film, History as HistoryIcon, Settings, Palette } from 'lucide-react'; 
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarContent } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/reels', label: 'Reels', icon: Film },
  { href: '/admin/stories', label: 'Stories', icon: HistoryIcon },
];

export function AdminSidebarContent() {
  const pathname = usePathname();

  return (
    <SidebarContent className="p-2 flex-grow">
      <SidebarMenu>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:text-transparent group-data-[collapsible=icon]:select-none">Management</SidebarGroupLabel>
            {adminNavItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
                    tooltip={{children: item.label, side: "right", align: "center"}}
                    asChild={false} 
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
        </SidebarGroup>
      </SidebarMenu>
    </SidebarContent>
  );
}

