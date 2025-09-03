
"use client";

import { useEffect } from 'react';
import { PostCard } from '@/components/post/post-card';
// CommentInput is now part of PostCard's footer
// CommentList is now rendered within PostCard
import type { Post as PostType, Comment as CommentInterface, PostOut, CurrentUser } from '@/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPostById } from '@/services/post-api';
import { getCommentsForPost } from '@/services/engagement-api';

interface PostPageClientContentProps {
  postIdString: string;
}

export default function PostPageClientContent({ postIdString }: PostPageClientContentProps) {
  const numericPostId = parseInt(postIdString, 10);
  const currentUser: CurrentUser | null | undefined = useCurrentUser();
  const queryClient = useQueryClient();

  const {
    data: postData,
    isLoading: isLoadingPost,
    error: postError
  } = useQuery<PostOut, Error>({
    queryKey: ['post', numericPostId],
    queryFn: () => getPostById(numericPostId),
    enabled: !isNaN(numericPostId),
  });

  const {
    data: commentsData,
    isLoading: isLoadingComments,
    error: commentsError
  } = useQuery<CommentInterface[], Error>({
    queryKey: ['postComments', numericPostId], // This query fetches ALL comments for the single post page
    queryFn: () => getCommentsForPost(numericPostId, 0, 100), // Fetch up to 100 comments
    enabled: !!postData && !isNaN(numericPostId),
  });

  // This function is passed to PostCard if PostCard needs to trigger a refetch higher up.
  // Since PostCard now handles its own comment input, direct comment data updates can be managed within PostCard
  // or via invalidating queries.
  const handleCommentAddedToPost = (_postIdIgnored: string, _newComment: CommentInterface) => {
    queryClient.invalidateQueries({ queryKey: ['postComments', numericPostId] });
    queryClient.invalidateQueries({ queryKey: ['post', numericPostId] }); // Also refetch post for comment_count update
  };
  
  const postForCardDisplay: PostType | null = postData ? {
    ...postData,
    comments: commentsData || [], // Pass all fetched comments to PostCard
    comment_count: commentsData?.length ?? postData.comment_count,
  } : null;


  if (isNaN(numericPostId)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="w-16 h-16 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold">Invalid Post ID</h2>
        <p>The post ID in the URL is not valid.</p>
      </div>
    );
  }

  if (isLoadingPost || (postData && isLoadingComments && commentsData === undefined)) {
    return (
       <div className="w-full max-w-xl mx-auto bg-card p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="w-full aspect-[4/5] rounded-md mb-4" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Separator className="my-4"/>
        {/* Skeletons for comments and input are now implicitly part of PostCard's loading state if needed */}
      </div>
    );
  }

  if (postError || !postForCardDisplay) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="w-16 h-16 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold">Post not found</h2>
        <p>{postError?.message || "This post may have been removed or the link is incorrect."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PostCard
        post={postForCardDisplay}
        onCommentAddedToPost={handleCommentAddedToPost}
        initialComments={commentsData || []} // Pass all fetched comments
        isLoadingInitialComments={isLoadingComments}
        showAllCommentsProp={true} // Indicate to PostCard it's on a page showing all comments
      />
      {/* The separate comment section below is no longer needed as PostCard handles it */}
      {/*
      <Card className="max-w-xl mx-auto shadow-lg rounded-xl">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-2">Comments ({postForCardDisplay.comment_count})</h2>
          <CommentInput postId={numericPostId.toString()} currentUser={currentUser} onCommentAdded={(newComment) => handleCommentAddedToPost(numericPostId.toString(), newComment)} />
          <Separator className="my-4" />
          {isLoadingComments && commentsData === undefined && <p>Loading comments...</p>}
          {commentsError && <p className="text-destructive">Error loading comments: {commentsError.message}</p>}
          {commentsData && commentsData.length > 0 && <CommentList comments={commentsData} postId={numericPostId} />}
          {!isLoadingComments && commentsData && commentsData.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Be the first to comment!</p>
          )}
        </CardContent>
      </Card>
      */}
    </div>
  );
}
