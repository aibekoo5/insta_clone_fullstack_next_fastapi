
"use client";

import type { CurrentUser, StoryOut, User, UserOut } from '@/types';
import { StoryAvatar } from './story-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMyStories, getStoriesFromFollowing } from '@/services/media-api';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMemo } from 'react';

interface StoryBarUser extends Pick<UserOut, 'id' | 'username' | 'profile_picture' | 'full_name' | 'email'> {
  hasActiveStory: boolean;
  storyToView?: StoryOut;
}

export function StoryBar() {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const { data: myStoriesData, isLoading: isLoadingMyStories } = useQuery<StoryOut[], Error>({
    queryKey: ['myStories'],
    queryFn: getMyStories,
    enabled: !!currentUser,
  });

  const { data: followingStoriesData, isLoading: isLoadingFollowingStories } = useQuery<StoryOut[], Error>({
    queryKey: ['followingStories'],
    queryFn: getStoriesFromFollowing,
    enabled: !!currentUser,
  });

  const isLoading = isLoadingMyStories || isLoadingFollowingStories;

  const handleAddStoryClick = () => {
    router.push('/stories/create');
  };

  const handleViewStoryClick = (story?: StoryOut, isMyStory: boolean = false) => {
    let effectiveOwner = story?.owner;
    if (isMyStory && currentUser && !story?.owner) {
      // If it's my story and the API didn't embed the owner, use currentUser details
      effectiveOwner = currentUser;
    }

    if (story && story.id && story.media_url && effectiveOwner && effectiveOwner.username) {
      const queryParams = new URLSearchParams({
        mediaUrl: story.media_url,
        ownerUsername: effectiveOwner.username,
      });
      if (effectiveOwner.profile_picture) {
        queryParams.set('ownerProfilePicture', effectiveOwner.profile_picture);
      }
      router.push(`/story/${story.id}?${queryParams.toString()}`);
    } else {
      console.error("StoryBar: Attempted to view story but essential data (story, media_url, or owner details) is missing. Story data:", JSON.stringify(story), "Effective Owner:", JSON.stringify(effectiveOwner));
    }
  };


  const storyUsers = useMemo(() => {
    const rawAllStories = [
      ...(myStoriesData || []),
      ...(followingStoriesData || [])
    ];

    // Filter out malformed stories early, be stricter for 'following' stories
    const allStories = rawAllStories.filter(
      s => {
        if (!s || typeof s.id !== 'number' || !s.media_url) return false;
        // For stories not belonging to current user (from followingStoriesData), owner must be present
        if (myStoriesData?.find(myStory => myStory.id === s.id)) { // Story is from myStoriesData
             return true; // Owner presence not strictly enforced here for "my stories"
        }
        // For "following" stories, owner must be valid
        return s.owner && typeof s.owner.id === 'number' && s.owner.username;
      }
    );

    const usersMap = new Map<number, StoryBarUser>();

    if (currentUser) {
      // For "myStories", we only need to check if there are any stories with id and media_url,
      // as they inherently belong to the current user.
      const validMyStoriesFromAPI = myStoriesData?.filter(
        s => s && typeof s.id === 'number' && s.media_url
      ) || [];
      const hasMyActualStories = validMyStoriesFromAPI.length > 0;

      const firstValidMyStoryFromAPI = hasMyActualStories ? validMyStoriesFromAPI[0] : undefined;
      
      console.log("StoryBar useMemo - currentUser:", currentUser?.username, "myStoriesData:", JSON.stringify(myStoriesData), "hasMyActualStories:", hasMyActualStories);

      usersMap.set(currentUser.id, {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        profile_picture: currentUser.profile_picture,
        full_name: currentUser.full_name,
        hasActiveStory: hasMyActualStories,
        // Ensure storyToView also has owner for handleViewStoryClick
        storyToView: firstValidMyStoryFromAPI ? { ...firstValidMyStoryFromAPI, owner: firstValidMyStoryFromAPI.owner || currentUser } : undefined,
      });
    }

    allStories.forEach(story => {
      // Process stories from 'following' or 'myStories' if they have a valid owner
      // (owner is already checked for 'following' in the `allStories` filter)
      if (story.owner && story.owner.id !== currentUser?.id) {
        if (!usersMap.has(story.owner.id) || !usersMap.get(story.owner.id)?.hasActiveStory) {
          usersMap.set(story.owner.id, {
            id: story.owner.id,
            username: story.owner.username,
            email: story.owner.email,
            profile_picture: story.owner.profile_picture,
            full_name: story.owner.full_name,
            hasActiveStory: true,
            storyToView: story,
          });
        }
      }
    });

    let sortedUsers = Array.from(usersMap.values());
    if (currentUser) {
      sortedUsers = sortedUsers.sort((a, b) => {
        if (a.id === currentUser.id) return -1;
        if (b.id === currentUser.id) return 1;
        if (a.hasActiveStory && !b.hasActiveStory) return -1;
        if (!a.hasActiveStory && b.hasActiveStory) return 1;
        return 0;
      });
    }
    return sortedUsers;

  }, [myStoriesData, followingStoriesData, currentUser]);


  if (isLoading && currentUser) {
    return (
      <div className="flex space-x-3 overflow-x-auto py-4 px-1 mb-4 border-b pb-4 scrollbar-hide">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-1 w-[70px] flex-shrink-0">
            <Skeleton className="h-[60px] w-[60px] rounded-full" />
            <Skeleton className="h-3 w-12 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  if (!currentUser || storyUsers.length === 0) {
    if (currentUser) { // If currentUser exists but storyUsers is empty (e.g. only current user, no stories)
      const hasMyOwnValidStoriesFromAPI = myStoriesData && myStoriesData.length > 0 && myStoriesData.some(
        s => s && typeof s.id === 'number' && s.media_url // Lenient check for "my stories"
      );
      const myFirstStoryFromAPI = hasMyOwnValidStoriesFromAPI ? myStoriesData?.find(
        s => s && typeof s.id === 'number' && s.media_url
      ) : undefined;

      const currentUserStoryUserPropsForAvatar: Pick<User, 'username' | 'profile_picture' | 'full_name' | 'hasActiveStory'> = {
        username: currentUser.username,
        profile_picture: currentUser.profile_picture,
        full_name: currentUser.full_name,
        hasActiveStory: !!hasMyOwnValidStoriesFromAPI,
      };
      return (
        <div className="flex space-x-3 overflow-x-auto py-4 px-1 mb-4 border-b pb-4 scrollbar-hide">
          <StoryAvatar
            user={currentUserStoryUserPropsForAvatar}
            isCurrentUserStory={true}
            onAddStoryClick={!hasMyOwnValidStoriesFromAPI ? handleAddStoryClick : undefined}
            onViewStoryClick={
              hasMyOwnValidStoriesFromAPI && myFirstStoryFromAPI ? () => handleViewStoryClick(myFirstStoryFromAPI, true) : undefined
            }
          />
        </div>
      )
    }
    return null;
  }


  return (
    <div className="flex space-x-3 overflow-x-auto py-4 px-1 mb-4 border-b pb-4 scrollbar-hide">
      {storyUsers.map(storyUser => {
        const isCurrentStoryUser = storyUser.id === currentUser?.id;
        const userPropsForAvatar: Pick<User, 'username' | 'profile_picture' | 'full_name' | 'hasActiveStory'> = {
          username: storyUser.username,
          profile_picture: storyUser.profile_picture,
          full_name: storyUser.full_name,
          hasActiveStory: storyUser.hasActiveStory,
        };
        return (
          <StoryAvatar
            key={storyUser.id}
            user={userPropsForAvatar}
            isCurrentUserStory={isCurrentStoryUser}
            onAddStoryClick={isCurrentStoryUser && !storyUser.hasActiveStory ? handleAddStoryClick : undefined}
            onViewStoryClick={storyUser.hasActiveStory && storyUser.storyToView ? () => handleViewStoryClick(storyUser.storyToView!, isCurrentStoryUser) : undefined}
          />
        );
      })}
    </div>
  );
}
