
"use client";

import type { Metadata } from 'next'; // Keep for potential static metadata
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreHorizontal, Search, Edit, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, deleteUser, updateUser } from '@/services/admin-api';
import type { AdminUser, UserUpdateRequest } from '@/types';
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
} from "@/components/ui/alert-dialog"


// Static metadata can be defined if needed, but title might be dynamic based on page
// export const metadata: Metadata = {
//   title: 'User Management',
// };

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
   // TODO: Implement Edit User Dialog/Modal
  // const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  // const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);


  const { data: users, isLoading, error, refetch } = useQuery<AdminUser[], Error>({
    queryKey: ['adminUsers'],
    queryFn: () => getUsers(0, 100), // Fetch more users initially or implement pagination
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast({ title: "User Deleted", description: "The user has been successfully deleted." });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: Error) => {
      toast({ title: "Error Deleting User", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsConfirmDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  });

  // TODO: Implement update user mutation
  // const updateUserMutation = useMutation({
  //   mutationFn: ({ userId, userData }: { userId: number, userData: AdminUserUpdate }) => updateUser(userId, userData),
  //   onSuccess: () => {
  //     toast({ title: "User Updated", description: "User details saved." });
  //     queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  //     setIsEditUserDialogOpen(false);
  //   },
  //   onError: (err: Error) => {
  //     toast({ title: "Error Updating User", description: err.message, variant: "destructive" });
  //   },
  // });

  const handleDeleteClick = (user: AdminUser) => {
    setUserToDelete(user);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };
  
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">View and manage all registered users.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} title="Refresh users">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled> {/* TODO: Implement Add User */}
            <PlusCircle className="mr-2 h-5 w-5" /> Add User
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Users ({filteredUsers?.length ?? '...'})</CardTitle>
           <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search users by username, email, name..." 
              className="pl-8 sm:w-[300px] md:w-[400px]" 
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
                  <TableHead>Username</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Full Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Admin</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-12 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {error && (
            <div className="text-center py-10 text-red-600">
              <AlertTriangle className="mx-auto h-12 w-12 mb-2"/>
              <p className="text-xl font-semibold">Error fetching users</p>
              <p>{error.message}</p>
              <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
            </div>
          )}
          {!isLoading && !error && filteredUsers && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Full Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Admin</TableHead>
                  {/* <TableHead className="hidden md:table-cell">Posts</TableHead> */}
                  {/* <TableHead className="hidden sm:table-cell">Joined Date</TableHead> */}
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.full_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"} className={user.is_active ? "bg-green-500/20 text-green-700 hover:bg-green-500/30" : "bg-red-500/10 text-red-700 hover:bg-red-500/20"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                       <Badge variant={user.is_admin ? "destructive" : "outline"}>
                        {user.is_admin ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    {/* <TableCell className="hidden md:table-cell">{user.postsCount || 0}</TableCell> */}
                    {/* <TableCell className="hidden sm:table-cell">{new Date(user.createdAt).toLocaleDateString()}</TableCell> */}
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
                          <DropdownMenuItem disabled> {/* TODO: Implement Edit User */}
                            <Edit className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
           {!isLoading && !error && (!filteredUsers || filteredUsers.length === 0) && (
             <p className="text-center text-muted-foreground py-8">
               {users && users.length > 0 && searchTerm ? 'No users match your search.' : 'No users found.'}
             </p>
           )}
        </CardContent>
        {/* TODO: Add Pagination if API supports it and many users */}
      </Card>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account <span className="font-semibold">{userToDelete?.username}</span> and remove their data from the servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* TODO: Implement Edit User Dialog
      {userToEdit && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User: {userToEdit.username}</DialogTitle>
            </DialogHeader>
            // Form to edit user details
          </DialogContent>
        </Dialog>
      )}
      */}
    </div>
  );
}
