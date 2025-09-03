
"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { Reel } from '@/types';
import { Play, Heart, MessageCircle } from 'lucide-react';
import { formatMediaUrl } from '@/lib/utils';

interface ReelGridItemProps {
  reel: Reel;
}

export function ReelGridItem({ reel }: ReelGridItemProps) {
  const reelLink = `/reels`; // Placeholder or future individual reel page: `/reel/${reel.id}`

  let imageSourceUrl: string | undefined;
  if (reel.thumbnailUrl) {
    imageSourceUrl = formatMediaUrl(reel.thumbnailUrl);
  } else if (reel.video_url) {
    imageSourceUrl = formatMediaUrl(reel.video_url);
  }

  const imageSrcToUse = imageSourceUrl || "https://placehold.co/200x355.png?text=Reel";
  
  // Robust owner handling for alt text
  const ownerUsername = reel.owner?.username || "[unknown user]";

  return (
    <Link href={reelLink} className="group relative block aspect-[9/16] overflow-hidden rounded-sm">
      <Image
        src={imageSrcToUse}
        alt={`Reel by ${ownerUsername}`}
        layout="fill"
        objectFit="cover"
        className="transition-transform duration-300 group-hover:scale-105"
        data-ai-hint="video thumbnail"
        unoptimized={!!imageSrcToUse && imageSrcToUse.includes('localhost')}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
        <Play className="h-10 w-10 text-white fill-white mb-3" />
        <div className="flex items-center gap-4 text-white text-sm">
          <div className="flex items-center">
            <Heart className="h-4 w-4 mr-1 fill-white" />
            <span>{reel.like_count || 0}</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-1 fill-white" />
            <span>{reel.comment_count || 0}</span>
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2 bg-black/50 text-white px-1.5 py-0.5 rounded text-xs">
        <Play className="h-3 w-3 inline-block mr-1" /> Reel
      </div>
    </Link>
  );
}
