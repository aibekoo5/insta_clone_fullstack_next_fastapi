
"use client";

import Link from 'next/link';
import type { Reel, UserOut } from '@/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LikeButton } from '@/components/post/like-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { formatDistanceToNowStrict } from 'date-fns';
import { MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { likeReel, unlikeReel } from '@/services/engagement-api';
import { useQueryClient } from '@tanstack/react-query';
import { formatMediaUrl } from '@/lib/utils';

interface ReelCardProps {
  reel: Reel; // Reel type already expects snake_case from API for counts/like_status
}

// Define a fallback owner object shape
const FALLBACK_OWNER: UserOut = {
  id: 0, // Default ID, will be overridden by reel.owner_id if available
  username: 'Unknown User',
  email: 'unknown@example.com', // Placeholder
  profile_picture: undefined,
  full_name: null,
  bio: null,
  is_active: true,
  is_admin: false,
  created_at: new Date().toISOString(),
};

export function ReelCard({ reel }: ReelCardProps) {
  const queryClient = useQueryClient();
  const timeAgo = formatDistanceToNowStrict(new Date(reel.created_at), { addSuffix: true });

  // Determine the effective owner, providing a fallback if reel.owner is missing or incomplete
  let effectiveOwner: UserOut;
  if (reel.owner && typeof reel.owner.id === 'number' && typeof reel.owner.username === 'string') {
    effectiveOwner = reel.owner;
  } else {
    console.warn(`ReelCard (ID: ${reel.id}): reel.owner is undefined or invalid. Using fallback. Reel data:`, JSON.stringify(reel, null, 2));
    effectiveOwner = { ...FALLBACK_OWNER, id: reel.owner_id }; // Use reel.owner_id for fallback
  }

  // Log to debug is_liked_by_current_user status
  if (typeof window !== 'undefined') {
    console.log(`ReelCard (ID: ${reel.id}) - reel.is_liked_by_current_user:`, reel.is_liked_by_current_user, "Reel Data:", JSON.parse(JSON.stringify(reel)));
  }

  const avatarUser = {
    username: effectiveOwner.username,
    profile_picture: effectiveOwner.profile_picture,
    name: effectiveOwner.full_name,
    email: effectiveOwner.email, // Ensure email is included for UserAvatar if it needs it
  };

  const handleLikeToggleAPI = async (newLikedStatus: boolean) => {
    try {
      if (newLikedStatus) {
        await likeReel(reel.id);
      } else {
        await unlikeReel(reel.id);
      }
      queryClient.invalidateQueries({ queryKey: ['allReels'] });
      queryClient.invalidateQueries({ queryKey: ['userReels', reel.owner_id] });
    } catch (error) {
      console.error("Failed to toggle reel like:", error);
      throw error;
    }
  };

  const displayVideoUrl = formatMediaUrl(reel.video_url);
  const displayThumbnailUrl = reel.thumbnailUrl ? formatMediaUrl(reel.thumbnailUrl) : undefined;


  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4">
        <Link href={`/profile/${effectiveOwner.username}`} className="flex items-center gap-3 group">
          <UserAvatar user={avatarUser} size="medium" />
          <div>
            <p className="font-semibold text-sm group-hover:underline">{effectiveOwner.username}</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </CardHeader>

      <div className="relative w-full aspect-[9/16] bg-muted">
        {displayVideoUrl ? (
          <video
            src={displayVideoUrl}
            controls
            loop
            className="w-full h-full object-cover"
            poster={displayThumbnailUrl || undefined} // Use undefined if null
            data-ai-hint="short video"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">No video source</div>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <LikeButton
            postId={reel.id.toString()}
            initialLikesCount={reel.like_count || 0} // Use snake_case from reel object
            isInitiallyLiked={!!reel.is_liked_by_current_user} // Use snake_case
            onLikeToggle={handleLikeToggleAPI}
          />
          <Button variant="ghost" size="icon" className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-accent/10 rounded-full" disabled>
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">Comment</span>
          </Button>
          <Button variant="ghost" size="icon" className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-accent/10 rounded-full" disabled>
            <Send className="h-6 w-6" />
            <span className="sr-only">Share</span>
          </Button>
        </div>

        {(reel.like_count || 0) > 0 && (
           <span className="text-sm font-semibold text-foreground block mb-1">
             {reel.like_count} {reel.like_count === 1 ? 'like' : 'likes'}
           </span>
        )}

        {reel.caption && (
          <p className="text-sm mb-2">
            <Link href={`/profile/${effectiveOwner.username}`} className="font-semibold hover:underline">
              {effectiveOwner.username}
            </Link>
            <span className="ml-1">{reel.caption}</span>
          </p>
        )}

        {(reel.comment_count || 0) > 0 && (
          <Button variant="link" size="sm" className="text-muted-foreground hover:underline p-0 h-auto text-xs" disabled>
            View all {reel.comment_count} comments
          </Button>
        )}
        <p className="text-xs text-muted-foreground uppercase mt-2">{timeAgo}</p>
      </CardContent>
    </Card>
  );
}
