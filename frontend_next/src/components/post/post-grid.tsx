
import type { Post, Reel } from '@/types';
import { PostGridItem } from './post-grid-item';
import { ReelGrid } from '@/components/reel/reel-grid'; // Added
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid3x3, Bookmark, Video } from 'lucide-react'; // Changed Tag to Video

interface ProfileContentGridProps {
  posts: Post[];
  reels: Reel[]; // Added
  userId: string; 
}

export function PostGrid({ posts, reels, userId }: ProfileContentGridProps) {
  
  const hasContent = posts.length > 0 || reels.length > 0;

  if (!hasContent) {
    return <p className="text-center text-muted-foreground mt-10">No posts or reels yet.</p>;
  }

  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:mx-auto mb-4 bg-transparent border-t">
        <TabsTrigger value="posts" className="data-[state=active]:shadow-none data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-muted-foreground py-3">
          <Grid3x3 className="mr-0 sm:mr-2 h-5 w-5" /> <span className="hidden sm:inline">POSTS</span>
        </TabsTrigger>
        <TabsTrigger value="reels" className="data-[state=active]:shadow-none data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-muted-foreground py-3">
           <Video className="mr-0 sm:mr-2 h-5 w-5" /> <span className="hidden sm:inline">REELS</span>
        </TabsTrigger>
        <TabsTrigger value="saved" className="data-[state=active]:shadow-none data-[state=active]:border-t-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none text-muted-foreground py-3">
           <Bookmark className="mr-0 sm:mr-2 h-5 w-5" /> <span className="hidden sm:inline">SAVED</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="posts">
        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 sm:gap-4">
            {posts.map((post) => (
              <PostGridItem key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">No posts yet.</p>
        )}
      </TabsContent>
      <TabsContent value="reels">
        <ReelGrid reels={reels} />
      </TabsContent>
      <TabsContent value="saved">
        <p className="text-center text-muted-foreground py-10">Saved content will appear here. (Not implemented)</p>
      </TabsContent>
    </Tabs>
  );
}
