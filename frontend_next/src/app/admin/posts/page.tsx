
"use client";

// import type { Metadata } from 'next'; // Cannot be used in client component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Eye, Trash2, Edit3, RefreshCw, AlertTriangle } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminPost } from '@/types'; // AdminPost is PostOut
import { getAdminPosts, adminDeletePost } from '@/services/admin-api';
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


export default function AdminPostsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<AdminPost | null>(null);

  const { data: posts, isLoading, error, refetch } = useQuery<AdminPost[], Error>({
    queryKey: ['adminPosts'],
    queryFn: () => getAdminPosts(0, 100), 
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => adminDeletePost(postId), 
    onSuccess: () => {
      toast({ title: "Post Deleted", description: "The post has been successfully deleted." });
      queryClient.invalidateQueries({ queryKey: ['adminPosts'] });
    },
    onError: (err: Error) => {
      toast({ title: "Error Deleting Post", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsConfirmDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  });

  const handleDeleteClick = (post: AdminPost) => {
    setPostToDelete(post);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete.id as number); 
    }
  };

  const filteredPosts = posts?.filter(post =>
    post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post Management</h1>
          <p className="text-muted-foreground">View and manage all user-generated posts.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} title="Refresh posts">
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Posts ({filteredPosts?.length ?? '...'})</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search posts by caption or user..." 
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
                  <TableHead className="hidden sm:table-cell w-[80px]">Image</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden md:table-cell">Likes</TableHead>
                  <TableHead className="hidden md:table-cell">Comments</TableHead>
                  <TableHead className="hidden sm:table-cell">Created At</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-10" /></TableCell>
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
              <p className="text-xl font-semibold">Error fetching posts</p>
              <p>{error.message}</p>
              <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
            </div>
          )}
          {!isLoading && !error && filteredPosts && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell w-[80px]">Media</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="hidden md:table-cell">Likes</TableHead>
                  <TableHead className="hidden md:table-cell">Comments</TableHead>
                  <TableHead className="hidden sm:table-cell">Created At</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => {
                  const displayMediaUrl = formatMediaUrl(post.image_url || post.video_url);
                  return (
                  <TableRow key={post.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt="Post media"
                        className="aspect-square rounded-md object-cover bg-muted"
                        height="64"
                        src={displayMediaUrl || "https://placehold.co/64x64.png?text=N/A"}
                        width="64"
                        unoptimized={!!displayMediaUrl && displayMediaUrl.includes('localhost')}
                        data-ai-hint="thumbnail social"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      <Link href={`/post/${post.id}`} className="hover:underline" target="_blank">
                          {post.caption || "No caption"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/profile/${post.owner.username}`} className="hover:underline" target="_blank">
                          {post.owner.username}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{post.like_count}</TableCell>
                    <TableCell className="hidden md:table-cell">{post.comment_count}</TableCell>
                    <TableCell className="hidden sm:table-cell">{format(new Date(post.created_at), "PPp")}</TableCell>
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
                          <DropdownMenuItem asChild><Link href={`/post/${post.id}`} target="_blank" className="flex items-center"><Eye className="mr-2 h-4 w-4"/>View Post</Link></DropdownMenuItem>
                          <DropdownMenuItem disabled> {/* TODO: Implement Edit Post */}
                            <Edit3 className="mr-2 h-4 w-4"/>Edit Post
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(post)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4"/>Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
          {!isLoading && !error && (!filteredPosts || filteredPosts.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              {posts && posts.length > 0 && searchTerm ? 'No posts match your search.' : 'No posts found.'}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              {postToDelete?.caption ? ` "${postToDelete.caption.substring(0,30)}..."` : ` by ${postToDelete?.owner.username}`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
