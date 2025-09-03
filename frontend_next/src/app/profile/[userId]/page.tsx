
"use client";

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/profile-header';
import { PostGrid } from '@/components/post/post-grid';
import type { User as FrontendUser, Post, Reel as ReelType, UserOut, ReelOut, PostOut, ApiError, ApiErrorDetail } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery, useIsFetching } from '@tanstack/react-query';
import { getUserReels } from '@/services/media-api';
import { getUserPosts } from '@/services/post-api';
import { getUserProfileByUsername } from '@/services/auth-api';
import { useCurrentUser, currentUserQueryKey } from '@/hooks/use-current-user';

// This function adapts UserOut (from API) to FrontendUser (used by ProfileHeader and potentially other UI)
const adaptUserOutToFrontendUser = (
  userOut: UserOut,
  postsCountFromData: number,
  reelsCountFromData: number
): FrontendUser => ({
  ...userOut,
  id: userOut.id,
  username: userOut.username,
  email: userOut.email,
  profile_picture: userOut.profile_picture,
  name: userOut.full_name, // For ProfileHeader 'name' prop
  bio: userOut.bio,
  is_active: userOut.is_active,
  created_at: userOut.created_at,
  postsCount: postsCountFromData,
  reelsCount: reelsCountFromData,
  followersCount: userOut.followers_count || 0,
  followingCount: userOut.following_count || 0,
  isFollowedByCurrentUser: !!userOut.is_followed_by_current_user,
  is_admin: userOut.is_admin,
});

interface UserProfilePageProps {
  params: Promise<{
    userId: string; // This is actually the username from the URL
  }>;
}

function getErrorMessageFromApiError(apiError: ApiError | null | undefined): string {
  const defaultMessage = "The profile you are looking for does not exist or the ID is invalid.";
  if (!apiError || !apiError.detail) {
    return defaultMessage;
  }
  if (typeof apiError.detail === 'string') {
    return apiError.detail;
  }
  if (Array.isArray(apiError.detail)) {
    return apiError.detail
      .map((d: ApiErrorDetail | string) => (typeof d === 'object' && d.msg ? d.msg : String(d)))
      .join('; ') || defaultMessage;
  }
  // Fallback for any other shape of detail
  return JSON.stringify(apiError.detail);
}


export default function UserProfilePage({ params: paramsPromise }: UserProfilePageProps) {
  const resolvedParams = use(paramsPromise);
  const profileUsername = resolvedParams.userId;
  const currentUser = useCurrentUser();
  const router = useRouter();
  const isFetchingCurrentUser = useIsFetching({ queryKey: currentUserQueryKey });

  useEffect(() => {
    if (!isFetchingCurrentUser && currentUser === null) {
      router.push('/login');
    }
  }, [currentUser, isFetchingCurrentUser, router]);

  const { data: profileUserData, isLoading: isLoadingProfileUser, error: profileUserError } = useQuery<UserOut, ApiError>({
    queryKey: ['userProfile', profileUsername],
    queryFn: async () => {
      const { user, error } = await getUserProfileByUsername(profileUsername);
      if (error) throw error; // react-query will catch this and set it to profileUserError
      if (!user) throw { detail: "User not found" } as ApiError; // Throw an ApiError compatible object
      return user;
    },
    enabled: !!profileUsername && (currentUser !== undefined),
  });

  const { data: postsData, isLoading: isLoadingPosts, error: postsError } = useQuery<PostOut[], Error>({
    queryKey: ['userPosts', profileUserData?.id],
    queryFn: () => getUserPosts(profileUserData!.id, 0, 50),
    enabled: !!profileUserData,
  });

  const { data: reelsData, isLoading: isLoadingReels, error: reelsError } = useQuery<ReelOut[], Error>({
    queryKey: ['userReels', profileUserData?.id],
    queryFn: () => getUserReels(profileUserData!.id, 0, 50),
    enabled: !!profileUserData,
  });

  const overallIsLoading = isFetchingCurrentUser || isLoadingProfileUser || (!!profileUserData && (isLoadingPosts || isLoadingReels) && (!postsData && !reelsData));

  if (overallIsLoading || currentUser === undefined) {
    return (
      <div>
        <div className="mb-8 p-4 md:p-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-12">
            <Skeleton className="h-32 w-32 rounded-full flex-shrink-0" />
            <div className="flex-grow space-y-4 w-full">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-8 w-1/4" />
              </div>
              <div className="flex gap-8 my-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
        <div className="flex justify-around items-center border-t mb-4 h-12">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square" />)}
        </div>
      </div>
    );
  }

  if (!currentUser && !isFetchingCurrentUser) {
    return null; 
  }

  if (profileUserError || !profileUserData) {
    const errorMessage = getErrorMessageFromApiError(profileUserError);
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="w-16 h-16 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold">User not found</h2>
        <p>{errorMessage}</p>
      </div>
    );
  }

  // At this point, profileUserData is available.
  const adaptedProfileUser: FrontendUser = adaptUserOutToFrontendUser(
    profileUserData,
    postsData?.length || 0,
    reelsData?.length || 0
  );

  // Check for errors fetching posts or reels after profile data is loaded
  if (postsError || reelsError) {
    console.error("Error fetching profile content details:", { postsError, reelsError });
    return (
      <div>
        <ProfileHeader user={adaptedProfileUser} />
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground mt-10 border-t pt-10">
          <AlertTriangle className="w-12 h-12 mb-3 text-destructive" />
          <h3 className="text-lg font-semibold">Error loading content</h3>
          <p className="text-sm">There was an issue fetching posts or reels for this user.</p>
          {postsError && <p className="text-xs text-destructive mt-1">Posts error: {postsError.message}</p>}
          {reelsError && <p className="text-xs text-destructive mt-1">Reels error: {reelsError.message}</p>}
        </div>
      </div>
    );
  }
  
  const adaptedPosts: Post[] = postsData?.map(postOut => ({
    ...postOut,
    isLikedByCurrentUser: postOut.is_liked_by_current_user || false,
    comments: [],
    owner: postOut.owner,
    image_url: postOut.image_url,
    video_url: postOut.video_url,
    like_count: postOut.like_count,
    comment_count: postOut.comment_count,
  })) || [];

  const adaptedReels: ReelType[] = reelsData?.map(reelOut => ({
    id: reelOut.id,
    video_url: reelOut.video_url,
    caption: reelOut.caption,
    owner_id: reelOut.owner_id,
    owner: reelOut.owner,
    created_at: reelOut.created_at,
    like_count: reelOut.like_count || 0,
    comment_count: reelOut.comment_count || 0,
    is_liked_by_current_user: reelOut.is_liked_by_current_user || false,
    thumbnailUrl: `https://placehold.co/200x355.png?text=Reel`, 
  })) || [];


  return (
    <div>
      <ProfileHeader user={adaptedProfileUser} />
      <PostGrid posts={adaptedPosts} reels={adaptedReels} userId={adaptedProfileUser.id.toString()} />
    </div>
  );
}
