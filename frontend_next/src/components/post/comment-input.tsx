
"use client";

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { User, Comment as CommentType, CommentCreate, CommentBrief, CurrentUser } from '@/types';
import { createCommentForPost } from '@/services/engagement-api';

interface CommentInputProps {
  postId: string;
  currentUser: CurrentUser | null | undefined; // Updated to accept undefined
  onCommentAdded?: (comment: CommentType) => void;
}

export function CommentInput({ postId, currentUser, onCommentAdded }: CommentInputProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) { // This check handles null and undefined currentUser
      if (!currentUser) {
        toast({ title: "Please log in to comment.", variant: "destructive" });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const numericPostId = parseInt(postId, 10);
      if (isNaN(numericPostId)) {
        toast({ title: "Error", description: "Invalid post ID.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const apiCommentData: CommentCreate = { content: commentText.trim() };
      const createdCommentBrief = await createCommentForPost(numericPostId, apiCommentData);

      if (onCommentAdded && currentUser) { // currentUser is confirmed to be non-null here
         const actualNewComment: CommentType = {
          id: createdCommentBrief.id,
          content: createdCommentBrief.content,
          user_id: createdCommentBrief.user_id,
          post_id: createdCommentBrief.post_id,
          parent_id: createdCommentBrief.parent_id,
          created_at: createdCommentBrief.created_at,
          owner: currentUser, // currentUser is UserOut compatible
          replies: [],
        };
        onCommentAdded(actualNewComment);
      }

      setCommentText('');
      // toast({ title: "Comment added!", description: "Your comment has been posted." });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) { // Handles both null and undefined
    return <p className="text-sm text-muted-foreground p-2">Log in to add a comment.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-2 px-0 border-t mt-2">
      <Input
        type="text"
        placeholder="Add a comment..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        className="flex-grow h-10 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-1"
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-primary hover:text-primary disabled:text-muted-foreground"
        disabled={isSubmitting || !commentText.trim()}
        aria-label="Post comment"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
