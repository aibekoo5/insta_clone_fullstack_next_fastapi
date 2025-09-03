
"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { Notification, PostOut, Comment as CommentType, UserOut } from '@/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import { Heart, MessageCircle, UserPlus, AtSign, Edit3, Image as ImageIcon, Video, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMediaUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
  notification: Notification;
  onNotificationClick?: (notificationId: number, isRead: boolean) => void;
}

export function NotificationItem({ notification, onNotificationClick }: NotificationItemProps) {
  const router = useRouter();
  const timeAgo = formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true });

  const handleRootItemClick = () => {
    if (onNotificationClick) {
      onNotificationClick(notification.id, notification.read);
    }
    if (primaryLink !== '#') {
      router.push(primaryLink);
    }
  };

  const handleInternalLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    if (onNotificationClick && !notification.read) {
      onNotificationClick(notification.id, notification.read);
    }
  };

  const renderIcon = () => {
    const iconClass = "h-4 w-4";
    switch (notification.type) {
      case 'like': return <Heart className={cn(iconClass, "text-red-500 fill-red-500")} />;
      case 'comment': return <MessageCircle className={cn(iconClass, "text-blue-500")} />;
      case 'follow': return <UserPlus className={cn(iconClass, "text-green-500")} />;
      case 'mention': return <AtSign className={cn(iconClass, "text-purple-500")} />;
      case 'new_post': return <Edit3 className={cn(iconClass, "text-orange-500")} />;
      default: return <Bell className={iconClass} />;
    }
  };

  const getPostLink = (post?: PostOut | null) => post ? `/post/${post.id}` : '#';
  const getCommentLink = (post?: PostOut | null, comment?: CommentType | null) => post && comment ? `/post/${post.id}#comment-${comment?.id}` : '#';

  const getNotificationContextText = () => {
    switch (notification.type) {
      case 'like':
        return <>liked your {notification.post ? <Link href={getPostLink(notification.post)} className="font-semibold hover:underline" onClick={handleInternalLinkClick}>post</Link> : 'content'}.</>;
      case 'comment':
        const commentText = notification.comment?.content;
        const shortComment = commentText && commentText.length > 30 ? `${commentText.substring(0, 30)}...` : commentText;
        return <>commented: "{shortComment}" on your {notification.post && notification.comment ? <Link href={getCommentLink(notification.post, notification.comment)} className="font-semibold hover:underline" onClick={handleInternalLinkClick}>post</Link> : 'content'}.</>;
      case 'follow':
        return <>started following you.</>;
      case 'mention':
        return <>mentioned you in a {notification.post ? <Link href={getPostLink(notification.post)} className="font-semibold hover:underline" onClick={handleInternalLinkClick}>comment</Link> : 'mention'}.</>;
      case 'new_post':
        return <>published a new {notification.post ? <Link href={getPostLink(notification.post)} className="font-semibold hover:underline" onClick={handleInternalLinkClick}>post</Link> : 'content'}.</>;
      default:
        // Handle undefined or unrecognized type more gracefully
        if (notification.type && notification.type.trim() !== '') {
          return `sent you a notification. (${notification.type})`;
        }
        return `sent you a notification.`;
    }
  };

  const primaryLink = notification.post
    ? getPostLink(notification.post)
    : (notification.sender ? `/profile/${notification.sender.username}` : '#');

  const rawPostMediaUrl = notification.post?.image_url || notification.post?.video_url;
  const displayMediaUrl = formatMediaUrl(rawPostMediaUrl);
  const isVideoPost = !!notification.post?.video_url;

  const senderForAvatar: UserOut = notification.sender || {
    id: 0, username: 'Unknown User', email: 'unknown@example.com', is_admin: false, created_at: new Date().toISOString()
  };

  return (
    <div
      onClick={handleRootItemClick}
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer",
        !notification.read && "bg-primary/5"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRootItemClick(); }}
    >
      <div className="relative flex-shrink-0">
        <UserAvatar
          user={senderForAvatar}
          size="medium"
        />
        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full shadow-md">
          {renderIcon()}
        </div>
      </div>
      <div className="flex-grow">
        <p className="text-sm">
          {notification.sender ? (
               <Link href={`/profile/${notification.sender.username}`} className="font-semibold hover:underline" onClick={handleInternalLinkClick}>
                  {notification.sender.username}
              </Link>
          ) : (
              <span className="font-semibold">Unknown User</span>
          )}
          <span className="ml-1 text-foreground/80">{getNotificationContextText()}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>
      {(notification.type === 'like' || notification.type === 'comment' || notification.type === 'mention' || notification.type === 'new_post') && displayMediaUrl && (
          <div className="relative w-10 h-10 flex-shrink-0 rounded-sm bg-muted overflow-hidden">
            <Image
              src={displayMediaUrl}
              alt="Post thumbnail"
              fill
              objectFit="cover"
              unoptimized={!!displayMediaUrl && displayMediaUrl.includes('localhost')}
              data-ai-hint="post thumbnail"
            />
            {isVideoPost && <Video className="absolute bottom-1 right-1 h-3 w-3 text-white fill-white/70" />}
          </div>
      )}
      {!notification.read && (
        <div className="self-center ml-auto w-2 h-2 bg-primary rounded-full flex-shrink-0" aria-label="Unread"></div>
      )}
    </div>
  );
}
