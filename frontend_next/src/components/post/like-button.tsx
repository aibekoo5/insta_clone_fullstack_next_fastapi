
"use client";

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { IconButton } from '@/components/shared/icon-button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LikeButtonProps {
  postId: string;
  initialLikesCount: number;
  isInitiallyLiked: boolean;
  onLikeToggle?: (liked: boolean) => Promise<void>; // Optional callback for actual API call
}

export function LikeButton({ postId, initialLikesCount, isInitiallyLiked, onLikeToggle }: LikeButtonProps) {
  const [liked, setLiked] = useState(isInitiallyLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log(`LikeButton (postId: ${postId}) useEffect syncing: isInitiallyLiked from prop is "${isInitiallyLiked}", initialLikesCount is "${initialLikesCount}". Setting internal 'liked' state to "${isInitiallyLiked}".`);
    setLiked(isInitiallyLiked);
    setLikesCount(initialLikesCount);
  }, [isInitiallyLiked, initialLikesCount, postId]);

  const handleLikeToggle = async () => {
    if (isPending) return;

    setIsPending(true);
    const previousLikedState = liked;
    const previousLikesCount = likesCount;

    // Optimistic update
    const newOptimisticLikedState = !previousLikedState;
    setLiked(newOptimisticLikedState);
    setLikesCount(previousLikesCount + (newOptimisticLikedState ? 1 : -1));
    console.log(`LikeButton (postId: ${postId}) optimistic update: internal 'liked' state set to "${newOptimisticLikedState}"`);


    try {
      if (onLikeToggle) {
        await onLikeToggle(newOptimisticLikedState); // Pass the new state to the API handler
      }
    } catch (error: any) {
      console.error(`LikeButton (postId: ${postId}) API error. Error:`, error);
      // Check if the error message indicates the post was already liked
      if (error.message && (error.message.includes("Post already liked") || error.message.includes("already liked"))) {
        // Backend confirms it was already liked. Ensure UI reflects this.
        // The UI was optimistically set to 'liked'. If the previous state was 'unliked',
        // this optimistic update is now confirmed by the backend's specific error.
        // We essentially want to keep the UI in the 'liked' state.
        if (!previousLikedState) { // If UI thought it wasn't liked before optimistic update
          setLiked(true); // Ensure it stays liked
          // The likesCount was optimistically incremented. This is likely correct now.
          // A subsequent refetch (triggered by PostCard) should provide the authoritative count.
        }
        toast({
          title: "Already Liked",
          description: "This post was already in your liked posts.",
          variant: "default", // Less alarming than "destructive"
        });
      } else {
        // Revert optimistic update for other, unexpected errors
        setLiked(previousLikedState);
        setLikesCount(previousLikesCount);
        toast({
          title: "Error",
          description: error.message || "Could not update like status. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <IconButton
        onClick={handleLikeToggle}
        disabled={isPending}
        aria-pressed={liked}
        className={cn(
          "p-1.5 rounded-full transition-colors duration-200 ease-in-out",
          liked ? "text-red-500 hover:bg-red-500/10" : "text-foreground/60 hover:text-foreground hover:bg-accent/10"
        )}
        variant="ghost"
        size="sm"
      >
        <Heart className={cn("h-6 w-6", liked && "fill-red-500")} />
        <span className="sr-only">{liked ? 'Unlike' : 'Like'}</span>
      </IconButton>
      {likesCount > 0 && (
         <span className="text-sm font-semibold text-foreground">
           {likesCount} {likesCount === 1 ? 'like' : 'likes'}
         </span>
      )}
    </div>
  );
}
