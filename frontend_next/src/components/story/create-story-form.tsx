
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/post/image-uploader';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { uploadStory } from '@/services/media-api'; // Updated import
import { useQueryClient } from '@tanstack/react-query';

export function CreateStoryForm() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageFile) {
      toast({
        title: 'No Image Selected',
        description: 'Please select an image for your story.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await uploadStory(imageFile);
      
      toast({
        title: 'Story Posted!',
        description: 'Your new story is live for 24 hours.',
      });
      // Invalidate queries related to stories so they refetch
      queryClient.invalidateQueries({ queryKey: ['myStories'] });
      queryClient.invalidateQueries({ queryKey: ['followingStories'] });
      router.push('/'); 
    } catch (error: any) {
      console.error('Failed to create story:', error);
      toast({
        title: 'Error Creating Story',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Create New Story</CardTitle>
        <CardDescription>Upload an image or video for your story. Stories are visible for 24 hours.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <ImageUploader onFileSelect={setImageFile} />
           <p className="text-xs text-muted-foreground text-center">
            Tip: Use portrait images (9:16 aspect ratio) for best results.
          </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting || !imageFile}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting Story...
              </>
            ) : (
              'Add to Your Story'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
