
import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/types'; // Post type should align with PostOut
import { Heart, MessageCircle, Video } from 'lucide-react';
import { formatMediaUrl } from '@/lib/utils';

interface PostGridItemProps {
  post: Post; // Expects Post type which should align with PostOut structure
}

export function PostGridItem({ post }: PostGridItemProps) {
  const displayImageUrl = formatMediaUrl(post.image_url);
  const displayVideoUrl = formatMediaUrl(post.video_url);
  const mediaUrl = displayImageUrl || displayVideoUrl;
  const isVideo = !!displayVideoUrl && !displayImageUrl; 

  if (!mediaUrl) {
    return (
      <div className="group relative block aspect-square overflow-hidden rounded-sm bg-muted flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No media</p>
      </div>
    );
  }

  return (
    <Link href={`/post/${post.id}`} className="group relative block aspect-square overflow-hidden rounded-sm">
      <Image
        src={displayImageUrl || "https://placehold.co/300x300.png?text=Media"}
        alt={`Post by ${post.owner.username}`}
        layout="fill"
        objectFit="cover"
        className="transition-transform duration-300 group-hover:scale-105"
        unoptimized={!!displayImageUrl && displayImageUrl.includes('localhost')}
        data-ai-hint="photo gallery"
      />
      {isVideo && (
        <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-sm">
          <Video className="h-4 w-4 text-white" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center">
            <Heart className="h-5 w-5 mr-1 fill-white" />
            <span>{post.like_count}</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-1 fill-white" />
            <span>{post.comment_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
