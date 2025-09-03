
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PostCard } from '@/components/post/post-card';
import { StoryBar } from '@/components/story/story-bar';
import type { Post as PostType, Comment as CommentType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser, currentUserQueryKey } from '@/hooks/use-current-user';
import { useQuery, useIsFetching } from '@tanstack/react-query';
import { getFeedPosts } from '@/services/post-api';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const isFetchingCurrentUser = useIsFetching({ queryKey: currentUserQueryKey });
  
  useEffect(() => {
    if (!isFetchingCurrentUser && currentUser === null) {
      router.push('/login');
    }
  }, [currentUser, isFetchingCurrentUser, router]);
  
  const { 
    data: posts, 
    isLoading: isLoadingPosts, 
    error: postsError,
    refetch: refetchPosts,
  } = useQuery<PostType[], Error>({
    queryKey: ['feedPosts'],
    queryFn: () => getFeedPosts(0, 20),
    enabled: !!currentUser, // Only fetch if user is logged in
  });

  const handleCommentAddedToPost = (postId: string, newComment: CommentType) => {
    console.log("Comment added on homepage PostCard, consider refetching or state management strategy.");
  };
  
  if (isFetchingCurrentUser || (currentUser === undefined)) {
    return (
      <div className="space-y-8 mt-6">
        <Skeleton className="h-20 w-full rounded-lg" /> {/* StoryBar Skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full max-w-xl mx-auto bg-card p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="w-full aspect-[4/5] rounded-md mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!currentUser) {
    // This should ideally not be reached if redirection works,
    // but acts as a fallback to prevent rendering content.
    return null; 
  }

  return (
    <div>
      <StoryBar />

      {isLoadingPosts && currentUser ? ( // Show post skeletons only if user is loaded and posts are loading
        <div className="space-y-8 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full max-w-xl mx-auto bg-card p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="w-full aspect-[4/5] rounded-md mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : postsError ? (
        <div className="text-center py-10 text-red-600">
            <AlertTriangle className="mx-auto h-12 w-12 mb-2"/>
            <p className="text-xl font-semibold">Error fetching posts</p>
            <p>{postsError.message}</p>
            <Button onClick={() => refetchPosts()} className="mt-4">Try Again</Button>
        </div>
      ) : !posts || posts.length === 0 ? (
        <p className="text-center text-muted-foreground mt-10">No posts yet. Follow some users or check back later!</p>
      ) : (
        <div className="space-y-8 mt-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onCommentAddedToPost={handleCommentAddedToPost} />
          ))}
        </div>
      )}
    </div>
  );
}
