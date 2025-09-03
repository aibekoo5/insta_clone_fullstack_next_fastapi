
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import type { Post, Comment as CommentType, UserOut, CurrentUser } from '@/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { LikeButton } from '@/components/post/like-button';
import { CommentInput } from '@/components/post/comment-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { formatDistanceToNowStrict } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import { getCommentsForPost } from '@/services/engagement-api';
import { CommentList } from './comment-list';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { likePost, unlikePost } from '@/services/engagement-api'; 
import { formatMediaUrl } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

interface PostCardProps {
  post: Post;
  onCommentAddedToPost?: (postId: string, comment: CommentType) => void;
  initialComments?: CommentType[];
  isLoadingInitialComments?: boolean;
  showAllCommentsProp?: boolean;
}

const COMMENTS_LIMIT_PREVIEW = 2;
const COMMENTS_LIMIT_FULL = 100;

export function PostCard({
  post,
  onCommentAddedToPost,
  initialComments,
  isLoadingInitialComments,
  showAllCommentsProp = false,
}: PostCardProps) {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient(); 
  const { t } = useTranslation();

  const [showInlineCommentsFully, setShowInlineCommentsFully] = useState(showAllCommentsProp);

  const commentsFetchLimit = showInlineCommentsFully ? COMMENTS_LIMIT_FULL : COMMENTS_LIMIT_PREVIEW;

  const {
    data: fetchedCommentsData,
    isLoading: isLoadingFetchedComments,
    isFetching: isFetchingMoreComments,
  } = useQuery<CommentType[], Error>({
    queryKey: ['postComments', post.id, commentsFetchLimit],
    queryFn: () => getCommentsForPost(post.id as number, 0, commentsFetchLimit),
    enabled: !initialComments && post.comment_count > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const commentsToDisplay = initialComments || fetchedCommentsData || [];
  const isLoadingComments = initialComments ? isLoadingInitialComments : isLoadingFetchedComments;

  if (typeof window !== 'undefined') { 
    console.log(`PostCard (ID: ${post.id}) - Received post.is_liked_by_current_user:`, post.is_liked_by_current_user, "Post Data:", JSON.parse(JSON.stringify(post)));
  }

  const handleLikeToggleAPI = async (newLikedStatus: boolean) => {
    try {
      if (newLikedStatus) {
        await likePost(post.id.toString());
      } else {
        await unlikePost(post.id.toString());
      }
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      queryClient.invalidateQueries({ queryKey: ['post', post.id] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', post.owner_id] }); 
    } catch (error) {
      console.error("Failed to toggle like:", error);
      throw error; 
    }
  };

  const handleCommentAddedOnCard = (newComment: CommentType) => {
    queryClient.invalidateQueries({ queryKey: ['postComments', post.id, commentsFetchLimit] });
    queryClient.invalidateQueries({ queryKey: ['postComments', post.id, COMMENTS_LIMIT_FULL] });
    queryClient.invalidateQueries({ queryKey: ['postComments', post.id, COMMENTS_LIMIT_PREVIEW] });
    
    queryClient.invalidateQueries({ queryKey: ['post', post.id] });
    queryClient.invalidateQueries({ queryKey: ['feedPosts']}); 

    if (onCommentAddedToPost) {
      onCommentAddedToPost(post.id.toString(), newComment);
    }
  };

  const handleToggleShowComments = () => {
    if (showAllCommentsProp) return; 
    setShowInlineCommentsFully(prev => !prev);
  };

  const timeAgo = formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true });
  const displayImageUrl = formatMediaUrl(post.image_url);
  const displayVideoUrl = formatMediaUrl(post.video_url);
  const mediaUrl = displayImageUrl || displayVideoUrl;
  
  const ownerForAvatar: UserOut = post.owner;

  return (
    <Card className="w-full max-w-xl mx-auto shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <Link href={`/profile/${post.owner.username}`} className="flex items-center gap-3 group">
          <UserAvatar
            user={ownerForAvatar}
            size="medium"
          />
          <div>
            <p className="font-semibold text-sm group-hover:underline">{post.owner.username}</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">{t('component.postCard.moreOptions')}</span>
        </Button>
      </CardHeader>

      {mediaUrl && (
        <Link href={`/post/${post.id}`} className="block">
          <div className="relative w-full aspect-[4/5] bg-muted">
            {displayImageUrl ? (
              <Image
                src={displayImageUrl}
                alt={`Post by ${post.owner.username}: ${post.caption?.substring(0,50) || 'image'}`}
                layout="fill"
                objectFit="cover"
                className="rounded-none"
                unoptimized={!!displayImageUrl && displayImageUrl.includes('localhost')}
                data-ai-hint="social media post"
              />
            ) : displayVideoUrl ? (
              <video
                src={displayVideoUrl}
                controls
                className="w-full h-full object-cover"
                poster={displayImageUrl || undefined}
                data-ai-hint="post video"
              />
            ) : null}
          </div>
        </Link>
      )}

      <CardContent className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <LikeButton
            postId={post.id.toString()}
            initialLikesCount={post.like_count}
            isInitiallyLiked={!!post.is_liked_by_current_user} 
            onLikeToggle={handleLikeToggleAPI}
          />
          <Link href={`/post/${post.id}#comments`} legacyBehavior>
            <Button variant="ghost" size="icon" className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-accent/10 rounded-full">
              <MessageCircle className="h-6 w-6" />
              <span className="sr-only">{t('component.postCard.commentAction')}</span>
            </Button>
          </Link>
        </div>

        {post.caption && (
          <p className="text-sm mb-1">
            <Link href={`/profile/${post.owner.username}`} className="font-semibold hover:underline">
              {post.owner.username}
            </Link>
            <span className="ml-1">{post.caption}</span>
          </p>
        )}

        {isLoadingComments && (
          <div className="py-2 flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('component.postCard.loadingComments')}
          </div>
        )}

        {!isLoadingComments && commentsToDisplay.length > 0 && (
          <div className="mt-2 space-y-1 max-h-80 overflow-y-auto pr-2"> 
            <CommentList comments={commentsToDisplay} postId={post.id as number} />
          </div>
        )}
        
        {!showAllCommentsProp && post.comment_count > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={handleToggleShowComments}
            className="text-primary hover:text-primary/80 hover:underline mt-1 px-0 py-1 h-auto text-xs"
            disabled={isFetchingMoreComments && showInlineCommentsFully}
          >
            {isFetchingMoreComments && showInlineCommentsFully ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                {t('component.postCard.loadingButton')}
              </>
            ) : showInlineCommentsFully ? (
              t('component.postCard.hideComments')
            ) : post.comment_count > commentsToDisplay.length && commentsToDisplay.length >= COMMENTS_LIMIT_PREVIEW ? (
              t('component.postCard.viewAllComments', { count: post.comment_count })
            ) : post.comment_count > COMMENTS_LIMIT_PREVIEW && commentsToDisplay.length < COMMENTS_LIMIT_PREVIEW && commentsToDisplay.length < post.comment_count ? (
              t('component.postCard.viewAllComments', { count: post.comment_count })
            ) :  commentsToDisplay.length > 0 && commentsToDisplay.length < post.comment_count && post.comment_count > COMMENTS_LIMIT_PREVIEW ? (
              t('component.postCard.viewAllComments', { count: post.comment_count })
            ) : null }
          </Button>
        )}


        {!isLoadingComments && post.comment_count === 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t('component.postCard.noComments')}</p>
        )}

        <p className="text-xs text-muted-foreground uppercase mt-2">{timeAgo}</p>
      </CardContent>

      <CardFooter className="p-0 border-t">
        <CommentInput postId={post.id.toString()} currentUser={currentUser} onCommentAdded={handleCommentAddedOnCard} />
      </CardFooter>
    </Card>
  );
}
