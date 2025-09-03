
"use client";

import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Eye, Trash2, Film, RefreshCw, AlertTriangle, Edit3 } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminReel } from '@/types';
import { getAdminReels, adminDeleteReel } from '@/services/admin-api';
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
import { format } from 'date-fns';
import { formatMediaUrl } from '@/lib/utils';


export default function AdminReelsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [reelToDelete, setReelToDelete] = useState<AdminReel | null>(null);

  const { data: reels, isLoading, error, refetch } = useQuery<AdminReel[], Error>({
    queryKey: ['adminReels'],
    queryFn: () => getAdminReels(0, 100), 
  });

  const deleteReelMutation = useMutation({
    mutationFn: adminDeleteReel,
    onSuccess: () => {
      toast({ title: "Reel Deleted", description: "The reel has been successfully deleted." });
      queryClient.invalidateQueries({ queryKey: ['adminReels'] });
    },
    onError: (err: Error) => {
      toast({ title: "Error Deleting Reel", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsConfirmDeleteDialogOpen(false);
      setReelToDelete(null);
    }
  });

  const handleDeleteClick = (reel: AdminReel) => {
    setReelToDelete(reel);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (reelToDelete) {
      deleteReelMutation.mutate(reelToDelete.id);
    }
  };

  const filteredReels = reels?.filter(reel =>
    reel.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reel.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Film className="h-8 w-8 text-primary" /> Reel Management
          </h1>
          <p className="text-muted-foreground">View and manage all user-generated reels.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} title="Refresh reels">
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Reels ({filteredReels?.length ?? '...'})</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search reels by caption or user..." 
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
                  <TableHead className="hidden sm:table-cell w-[80px]">Thumbnail</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden sm:table-cell">Created At</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-[113px] w-[64px] rounded-md" /></TableCell> 
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {error && (
            <div className="text-center py-10 text-red-600">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2"/>
              <p className="text-xl font-semibold">Error fetching reels</p>
              <p>{error.message}</p>
              <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
            </div>
          )}
          {!isLoading && !error && filteredReels && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell w-[72px]">Thumbnail</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden sm:table-cell">Created At</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReels.map((reel) => {
                  const displayThumbnailUrl = formatMediaUrl(reel.video_url); // Assuming video_url can serve as thumbnail or backend provides one
                  return (
                  <TableRow key={reel.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt="Reel thumbnail"
                        className="aspect-[9/16] rounded-md object-cover bg-muted"
                        height="128" 
                        src={displayThumbnailUrl || "https://placehold.co/72x128.png?text=Reel"}
                        width="72"
                        unoptimized={!!displayThumbnailUrl && displayThumbnailUrl.includes('localhost')}
                        data-ai-hint="video thumbnail"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      <Link href={`/reels`} target="_blank" className="hover:underline" title="View public Reels page (individual reel view not implemented)">
                          {reel.caption || "No caption"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/profile/${reel.owner.username}`} className="hover:underline" target="_blank">
                          {reel.owner.username}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{format(new Date(reel.created_at), "PPp")}</TableCell>
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
                          <DropdownMenuItem disabled> <Eye className="mr-2 h-4 w-4"/>View Reel (N/A)</DropdownMenuItem>
                          <DropdownMenuItem disabled> <Edit3 className="mr-2 h-4 w-4"/>Edit Reel</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(reel)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4"/>Delete Reel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
          {!isLoading && !error && (!filteredReels || filteredReels.length === 0) && (
             <p className="text-center text-muted-foreground py-8">
               {reels && reels.length > 0 && searchTerm ? 'No reels match your search.' : 'No reels found.'}
             </p>
           )}
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this reel?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the reel
              {reelToDelete?.caption ? ` "${reelToDelete.caption.substring(0,30)}..."` : ` by ${reelToDelete?.owner.username}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReelToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteReelMutation.isPending}
            >
              {deleteReelMutation.isPending ? "Deleting..." : "Delete Reel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
