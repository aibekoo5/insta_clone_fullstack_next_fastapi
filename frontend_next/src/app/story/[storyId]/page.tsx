
"use client";

import { useRouter, useSearchParams } from 'next/navigation'; 
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatMediaUrl } from '@/lib/utils';

interface StoryData {
  mediaUrl: string;
  ownerUsername: string;
  ownerProfilePicture?: string;
}

export default function StoryViewerPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rawMediaUrl = searchParams.get('mediaUrl');
    const ownerUsername = searchParams.get('ownerUsername');
    const rawOwnerProfilePicture = searchParams.get('ownerProfilePicture');

    if (rawMediaUrl && ownerUsername) {
      setStoryData({
        mediaUrl: formatMediaUrl(rawMediaUrl) || "https://placehold.co/360x640.png?text=Error",
        ownerUsername,
        ownerProfilePicture: formatMediaUrl(rawOwnerProfilePicture) || undefined,
      });
    } else {
      setError("Story data not found in URL. Please try again.");
    }
    setIsLoading(false);
  }, [searchParams]);


  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 text-white">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error || !storyData) {
    return (
      <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 text-white p-4">
        <AlertTriangle className="w-16 h-16 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold">Could not load story</h2>
        <p>{error || "The story might be unavailable or the link is incorrect."}</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-6 text-black">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4 transition-opacity duration-300 animate-in fade-in">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="absolute top-4 right-4 text-white hover:bg-white/20 hover:text-white h-10 w-10 rounded-full"
        aria-label="Close story"
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg aspect-[9/16] rounded-lg overflow-hidden shadow-2xl bg-black">
        <Image
          src={storyData.mediaUrl}
          alt={`Story by ${storyData.ownerUsername}`}
          layout="fill"
          objectFit="contain" 
          className="rounded-lg"
          unoptimized={!!storyData.mediaUrl && storyData.mediaUrl.includes('localhost')}
          data-ai-hint="story media"
        />
      </div>
      
      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <Link href={`/profile/${storyData.ownerUsername}`} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-muted">
            {storyData.ownerProfilePicture ? (
              <Image 
                  src={storyData.ownerProfilePicture} 
                  alt={storyData.ownerUsername}
                  width={32}
                  height={32}
                  objectFit="cover"
                  unoptimized={!!storyData.ownerProfilePicture && storyData.ownerProfilePicture.includes('localhost')}
                  data-ai-hint="profile picture"
              />
            ) : (
               <Image 
                  src={"https://placehold.co/40x40.png?text=PFP"} 
                  alt={storyData.ownerUsername}
                  width={32}
                  height={32}
                  objectFit="cover"
                  data-ai-hint="profile picture"
              />
            )}
          </div>
          <span className="text-white text-sm font-semibold group-hover:underline">{storyData.ownerUsername}</span>
        </Link>
      </div>
    </div>
  );
}
