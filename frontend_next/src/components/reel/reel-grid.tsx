
import type { Reel } from '@/types';
import { ReelGridItem } from './reel-grid-item';

interface ReelGridProps {
  reels: Reel[];
}

export function ReelGrid({ reels }: ReelGridProps) {
  if (reels.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No reels yet.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-1"> {/* Reels are often tighter packed */}
      {reels.map((reel) => (
        <ReelGridItem key={reel.id} reel={reel} />
      ))}
    </div>
  );
}
