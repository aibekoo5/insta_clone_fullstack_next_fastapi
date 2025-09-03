
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VideoUploader } from '@/components/shared/video-uploader';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { uploadReel } from '@/services/media-api'; // Updated import
import { useQueryClient } from '@tanstack/react-query';

export function CreateReelForm() {
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!videoFile) {
      toast({
        title: 'No Video Selected',
        description: 'Please select a video to upload for your reel.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await uploadReel(videoFile, caption);
      
      toast({
        title: 'Reel Shared!',
        description: 'Your new reel is live.',
      });
      // Invalidate queries related to reels
      queryClient.invalidateQueries({ queryKey: ['followingReels'] });
      queryClient.invalidateQueries({ queryKey: ['userReels'] }); // A general key if used, or specific if userId is part of key
      router.push('/reels'); 
    } catch (error: any) {
      console.error('Failed to create reel:', error);
      toast({
        title: 'Error Sharing Reel',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Create New Reel</CardTitle>
        <CardDescription>Upload a short video and add a caption to share as a Reel.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <VideoUploader onFileSelect={setVideoFile} />
          <div>
            <Textarea
              placeholder="Write a caption... (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="resize-none"
              maxLength={500} 
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {caption.length} / 500
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting || !videoFile}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing Reel...
              </>
            ) : (
              'Share Reel'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
