
"use client";

import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Activity, BarChart3, ShieldAlert, Film, History, Loader2, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getUsers, getAdminPosts, getAdminReels, getAdminStories } from '@/services/admin-api';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminUser, AdminPost, AdminReel, AdminStory } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

interface StatCardProps<T> {
  titleKey: string; // Changed from title to titleKey
  icon: React.ElementType;
  queryKey: string;
  queryFn: () => Promise<T[]>; 
  manageLink: string;
  manageTextKey: string; // Changed from manageText to manageTextKey
}

function StatCard<T>({ titleKey, icon: Icon, queryKey, queryFn, manageLink, manageTextKey }: StatCardProps<T>) {
  const { t } = useTranslation();
  const { data: items, isLoading, error } = useQuery<T[], Error, { count: number }>({
    queryKey: [queryKey, 'dashboardCountFromList'], 
    queryFn: async () => {
      const fetchedItems = await queryFn();
      return fetchedItems; 
    },
    select: (fetchedItems) => ({ count: fetchedItems.length }), 
  });

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t(titleKey)}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-7 w-16 mb-1" />}
        {error && <p className="text-destructive text-sm">{t('page.adminDashboard.statCard_errorLoadingCount')}</p>}
        {!isLoading && !error && items && ( 
          <div className="text-2xl font-bold">{items.count}</div>
        )}
        {!isLoading && !error && items === null && ( 
           <div className="text-2xl font-bold">0</div>
        )}
        <Button variant="link" asChild className="px-0 pt-2 text-sm">
          <Link href={manageLink}>{t(manageTextKey)}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}


export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const DASHBOARD_ITEM_LIMIT = 1000;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('page.adminDashboard.title')}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard<AdminUser>
          titleKey="page.adminDashboard.statCard_totalUsers"
          icon={Users}
          queryKey="adminUsers"
          queryFn={() => getUsers(0, DASHBOARD_ITEM_LIMIT)}
          manageLink="/admin/users"
          manageTextKey="page.adminDashboard.statCard_manageUsers"
        />
        <StatCard<AdminPost>
          titleKey="page.adminDashboard.statCard_totalPosts"
          icon={FileText}
          queryKey="adminPosts"
          queryFn={() => getAdminPosts(0, DASHBOARD_ITEM_LIMIT)}
          manageLink="/admin/posts"
          manageTextKey="page.adminDashboard.statCard_managePosts"
        />
        <StatCard<AdminReel>
          titleKey="page.adminDashboard.statCard_totalReels"
          icon={Film}
          queryKey="adminReels"
          queryFn={() => getAdminReels(0, DASHBOARD_ITEM_LIMIT)}
          manageLink="/admin/reels"
          manageTextKey="page.adminDashboard.statCard_manageReels"
        />
        <StatCard<AdminStory>
          titleKey="page.adminDashboard.statCard_totalStories"
          icon={History}
          queryKey="adminStories"
          queryFn={() => getAdminStories(0, DASHBOARD_ITEM_LIMIT)}
          manageLink="/admin/stories"
          manageTextKey="page.adminDashboard.statCard_manageStories"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md md:col-span-2"> 
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive"/> {t('page.adminDashboard.systemStatus_title')}</CardTitle>
            <CardDescription>{t('page.adminDashboard.systemStatus_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p>{t('page.adminDashboard.systemStatus_dbConnection')}</p>
              <span className="text-green-500 font-semibold">{t('page.adminDashboard.systemStatus_healthy')}</span>
            </div>
            <div className="flex items-center justify-between">
              <p>{t('page.adminDashboard.systemStatus_apiServices')}</p>
              <span className="text-green-500 font-semibold">{t('page.adminDashboard.systemStatus_operational')}</span>
            </div>
             <div className="flex items-center justify-between">
              <p>{t('page.adminDashboard.systemStatus_backgroundJobs')}</p>
              <span className="text-yellow-500 font-semibold">{t('page.adminDashboard.systemStatus_degraded')}</span>
            </div>
             <Button variant="outline" size="sm" className="mt-2" disabled>{t('page.adminDashboard.systemStatus_viewLogsButton')}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
