
"use client";

import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Eye, Trash2, History as HistoryIcon, RefreshCw, AlertTriangle } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminStory } from '@/types';
import { getAdminStories, adminDeleteStory } from '@/services/admin-api';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNowStrict } from 'date-fns';
import { formatMediaUrl } from '@/lib/utils';


const getTimeUntilExpiry = (expiryDate: string): string => {
  const expiryTime = new Date(expiryDate);
  const now = new Date();
  if (expiryTime < now) {
    return "Expired";
  }
  return formatDistanceToNowStrict(expiryTime, { addSuffix: true });
};

export default function AdminStoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<AdminStory | null>(null);

  const { data: stories, isLoading, error, refetch } = useQuery<AdminStory[], Error>({
    queryKey: ['adminStories'],
    queryFn: () => getAdminStories(0, 100), 
  });

  const deleteStoryMutation = useMutation({
    mutationFn: adminDeleteStory,
    onSuccess: () => {
      toast({ title: "Story Deleted", description: "The story has been successfully deleted." });
      queryClient.invalidateQueries({ queryKey: ['adminStories'] });
    },
    onError: (err: Error) => {
      toast({ title: "Error Deleting Story", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsConfirmDeleteDialogOpen(false);
      setStoryToDelete(null);
    }
  });

  const handleDeleteClick = (story: AdminStory) => {
    setStoryToDelete(story);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (storyToDelete) {
      deleteStoryMutation.mutate(storyToDelete.id);
    }
  };
  
  const filteredStories = stories?.filter(story =>
    story.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HistoryIcon className="h-8 w-8 text-primary" /> Story Management
          </h1>
          <p className="text-muted-foreground">View and manage all user-generated stories.</p>
        </div>
         <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} title="Refresh stories">
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Stories ({filteredStories?.length ?? '...'})</CardTitle>
           <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search stories by user..." 
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
           {isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell w-[80px]">Media</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden md:table-cell">Created At</TableHead>
                  <TableHead>Expires In</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-[113px] w-[64px] rounded-md" /></TableCell> 
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {error && (
            <div className="text-center py-10 text-red-600">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2"/>
              <p className="text-xl font-semibold">Error fetching stories</p>
              <p>{error.message}</p>
              <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
            </div>
          )}
          {!isLoading && !error && filteredStories && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell w-[72px]">Media</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden md:table-cell">Created At</TableHead>
                  <TableHead>Expires In</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStories.map((story) => {
                  const displayMediaUrl = formatMediaUrl(story.media_url);
                  return (
                  <TableRow key={story.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt="Story media"
                        className="aspect-[9/16] rounded-md object-cover bg-muted"
                        height="128"
                        src={displayMediaUrl || "https://placehold.co/72x128.png?text=Story"}
                        width="72"
                        unoptimized={!!displayMediaUrl && displayMediaUrl.includes('localhost')}
                        data-ai-hint="photo story"
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/profile/${story.owner.username}`} className="hover:underline" target="_blank">
                          {story.owner.username}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(story.created_at), "PPp")}
                    </TableCell>
                    <TableCell>{getTimeUntilExpiry(story.expires_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem disabled><Eye className="mr-2 h-4 w-4"/>View Story (N/A)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(story)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4"/>Delete Story
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
           {!isLoading && !error && (!filteredStories || filteredStories.length === 0) && (
             <p className="text-center text-muted-foreground py-8">
               {stories && stories.length > 0 && searchTerm ? 'No stories match your search.' : 'No stories found.'}
             </p>
           )}
        </CardContent>
      </Card>

       <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this story?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the story by <span className="font-semibold">{storyToDelete?.owner.username}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStoryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteStoryMutation.isPending}
            >
              {deleteStoryMutation.isPending ? "Deleting..." : "Delete Story"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
