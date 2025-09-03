
"use client";

import Link from 'next/link';
import type { Comment as CommentType, UserOut, CurrentUser } from '@/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCommentById } from '@/services/engagement-api';
import { useToast } from '@/hooks/use-toast';

interface CommentItemProps {
  comment: CommentType;
  postId: number;
}

const FALLBACK_USER: UserOut = {
  id: 0,
  username: '[deleted user]',
  email: 'deleted@example.com',
  profile_picture: undefined,
  full_name: null,
  bio: null,
  is_active: false,
  created_at: new Date().toISOString(),
};

export function CommentItem({ comment, postId }: CommentItemProps) {
  const timeAgo = formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: true });
  const currentUser: CurrentUser | null | undefined = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // console.log("CommentItem - rendering comment:", JSON.parse(JSON.stringify(comment)));
  // if (currentUser) {
  //   console.log("CommentItem - currentUser:", JSON.parse(JSON.stringify(currentUser)));
  // }

  let userForDisplay: UserOut;
  const commentOwnerIsCurrentUserFromId = currentUser && comment.user_id === currentUser.id;

  // Check if the user object provided with the comment is valid
  const isCommentUserValid = comment.owner &&
                             typeof comment.owner.id === 'number' &&
                             typeof comment.owner.username === 'string';

  if (isCommentUserValid) {
    userForDisplay = comment.owner;
  } else if (commentOwnerIsCurrentUserFromId && currentUser) {
    // If comment.user is invalid, but comment.user_id matches current user, use currentUser
    userForDisplay = currentUser;
  } else {
    userForDisplay = FALLBACK_USER;
  }
  
  const commentUserToDisplay: UserOut = userForDisplay;


  const isOwner = currentUser?.id === commentUserToDisplay.id && commentUserToDisplay.username !== FALLBACK_USER.username;
  const isAdmin = currentUser?.is_admin;
  
  const canDelete = isAdmin || (isOwner && commentUserToDisplay.username !== FALLBACK_USER.username);


  const deleteCommentMutation = useMutation({
    mutationFn: () => deleteCommentById(comment.id as number), 
    onSuccess: () => {
      toast({ title: "Comment Deleted", description: "The comment has been removed." });
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] }); 
    },
    onError: (error: Error) => {
      toast({ title: "Error Deleting Comment", description: error.message || "Could not delete comment.", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  const handleDelete = () => {
    if (typeof comment.id === 'number') {
        deleteCommentMutation.mutate();
    } else {
        toast({ title: "Error", description: "Invalid comment ID for deletion.", variant: "destructive" });
    }
  };

  const renderUserLink = () => {
    if (commentUserToDisplay.username === FALLBACK_USER.username) {
      return (
        <>
          <UserAvatar user={commentUserToDisplay} size="small" />
          <div className="flex-grow">
            <p className="text-sm">
              <span className="font-semibold">{commentUserToDisplay.username}</span>
              <span className="ml-1.5">{comment.content}</span>
            </p>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <span>{timeAgo}</span>
            </div>
          </div>
        </>
      );
    }
    return (
      <>
        <Link href={`/profile/${commentUserToDisplay.username}`} passHref>
          <UserAvatar user={commentUserToDisplay} size="small" />
        </Link>
        <div className="flex-grow">
          <p className="text-sm">
            <Link href={`/profile/${commentUserToDisplay.username}`} className="font-semibold hover:underline">
              {commentUserToDisplay.username}
            </Link>
            <span className="ml-1.5">{comment.content}</span>
          </p>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span>{timeAgo}</span>
            {/* Reply button can be added here later */}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex gap-3 py-2">
      {renderUserLink()}
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={deleteCommentMutation.isPending}
          aria-label="Delete comment"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
