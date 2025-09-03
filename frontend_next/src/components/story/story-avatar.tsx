
"use client";

import type { User } from '@/types'; 
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface StoryAvatarProps {
  user: Pick<User, 'username' | 'profile_picture' | 'full_name' | 'hasActiveStory'>; // Added email
  isCurrentUserStory?: boolean;
  onAddStoryClick?: () => void;
  onViewStoryClick?: () => void; 
}

export function StoryAvatar({ user, isCurrentUserStory = false, onAddStoryClick, onViewStoryClick }: StoryAvatarProps) {
  const hasStory = user.hasActiveStory;
  const displayName = isCurrentUserStory ? "Your Story" : user.username;

  const handleAvatarClick = () => {
    if (isCurrentUserStory && !hasStory && onAddStoryClick) {
      onAddStoryClick();
    } else if (onViewStoryClick) { // Call onViewStoryClick if it's provided, regardless of hasStory for others
      onViewStoryClick();
    }
  };
  
  const userAvatarProps = {
    username: user.username,
    profile_picture: user.profile_picture,
    name: user.full_name,
  };

  if (isCurrentUserStory && !hasStory && onAddStoryClick) {
    return (
      <div
        className="flex flex-col items-center space-y-1 cursor-pointer w-[70px] flex-shrink-0 text-center group"
        onClick={handleAvatarClick}
        role="button"
        tabIndex={0}
        aria-label="Add to your story"
      >
        <div className="relative">
          <UserAvatar user={userAvatarProps} size="story" className="opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background group-hover:scale-110 transition-transform">
            <Plus className="h-3 w-3" />
          </div>
        </div>
        <span className="text-xs font-medium truncate w-full">{displayName}</span>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center space-y-1 cursor-pointer w-[70px] flex-shrink-0 text-center group"
      onClick={handleAvatarClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${displayName}'s story`}
    >
      <div
        className={cn(
          "rounded-full p-0.5 transition-all transform group-hover:scale-105",
          hasStory ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600" : "bg-border p-[2.5px]" 
        )}
      >
        <div className={cn("bg-background p-[2px] rounded-full", !hasStory && "p-0")}>
          <UserAvatar user={userAvatarProps} size="story" />
        </div>
      </div>
      <span className="text-xs font-medium truncate w-full">{displayName}</span>
    </div>
  );
}
