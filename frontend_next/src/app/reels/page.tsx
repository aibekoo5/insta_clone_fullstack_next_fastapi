
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReelCard } from '@/components/reel/reel-card';
import type { ReelOut, UserOut } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Film, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery, useIsFetching } from '@tanstack/react-query';
import { getAllReels } from '@/services/media-api';
import { Button } from '@/components/ui/button';
import { useCurrentUser, currentUserQueryKey } from '@/hooks/use-current-user';

export default function ReelsPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  const [skip, setSkip] = useState(0);
  const limit = 5;

  const {
    data: reelsData,
    isLoading: isLoadingReels,
    error,
  } = useQuery<ReelOut[], Error>({
    queryKey: ['allReels', skip],
    queryFn: () => getAllReels(skip, limit),
    // enabled: !!currentUser, // All reels page might not require login
  });

  useEffect(() => {
    if (!isLoadingReels) {
      console.log("ReelsPage - Fetched all reels (reelsData):", JSON.stringify(reelsData, null, 2));
      if (error) {
        console.error("ReelsPage - Error fetching all reels:", error);
      }
    }
  }, [reelsData, isLoadingReels, error]);

  // Relaxed filter: only check for essential reel properties.
  // ReelCard will handle missing owner details with placeholders.
  const validReels = reelsData?.filter(reel =>
    reel &&
    typeof reel.id === 'number' &&
    typeof reel.owner_id === 'number' // Ensure owner_id exists for fallback in ReelCard
  ) || [];

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoadingReels) {
      console.log("ReelsPage - Filtered validReels:", JSON.stringify(validReels, null, 2));
      console.log("ReelsPage - Number of validReels:", validReels.length);
    }
  }, [validReels, isLoadingReels]);


  if (isLoadingReels) {
    return (
      <div className="py-8">
        <div className="flex justify-center items-center mb-6">
          <Film className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold ml-3">Reels</h1>
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full max-w-sm mx-auto bg-card p-0 rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="w-full aspect-[9/16]" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error Loading Reels</h1>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8">
       <div className="flex justify-center items-center mb-6">
          <Film className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold ml-3 tracking-tight">Reels</h1>
        </div>
      {!validReels || validReels.length === 0 ? (
         <div className="text-center text-muted-foreground mt-10">
            <p className="text-xl">No reels to show right now.</p>
            <p>Check back later for new content!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {validReels.map((reelData) => {
            // Construct a basic owner object if reelData.owner is missing, using owner_id
            const ownerForCard: UserOut = reelData.owner || {
              id: reelData.owner_id, // Use owner_id for the fallback owner's ID
              username: 'Unknown User', // Placeholder username
              email: 'unknown@example.com', // Placeholder email
              // Add other required fields for UserOut with default/null values
              profile_picture: undefined,
              full_name: null,
              bio: null,
              is_active: true,
              is_admin: false,
              created_at: new Date().toISOString(),
            };

            return (
              <ReelCard key={reelData.id} reel={{
                id: reelData.id,
                owner_id: reelData.owner_id,
                owner: ownerForCard, // Pass the potentially reconstructed owner
                video_url: reelData.video_url,
                caption: reelData.caption,
                like_count: reelData.like_count || 0,
                comment_count: reelData.comment_count || 0,
                created_at: reelData.created_at,
                is_liked_by_current_user: reelData.is_liked_by_current_user || false,
                thumbnailUrl: `https://placehold.co/360x640.png?text=Reel+${reelData.id}` // Placeholder thumbnail
              }} />
            );
          })}
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={() => setSkip(prev => Math.max(0, prev - limit))} disabled={skip === 0 || isLoadingReels}>
              Previous
            </Button>
            <Button onClick={() => setSkip(prev => prev + limit)} disabled={!reelsData || reelsData.length < limit || isLoadingReels}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
