
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/post/image-uploader'; // Assuming this handles image OR video conceptually or a new uploader is made
import { VideoUploader } from '@/components/shared/video-uploader'; // For video specific uploads
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { createNewPost } from '@/services/post-api';
import { useQueryClient } from '@tanstack/react-query';

export function CreatePostForm() {
  const [caption, setCaption] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = (file: File | null, type: 'image' | 'video') => {
    if (file) {
      setMediaFile(file);
      setMediaType(type);
    } else { // If file is deselected
      setMediaFile(null);
      setMediaType(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mediaFile || !mediaType) {
      toast({
        title: 'No Media Selected',
        description: 'Please select an image or video to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('is_private', String(isPrivate));
    if (mediaType === 'image' && mediaFile) {
      formData.append('image', mediaFile);
    } else if (mediaType === 'video' && mediaFile) {
      formData.append('video', mediaFile);
    }
    
    try {
      await createNewPost(formData);
      toast({
        title: 'Post Created!',
        description: 'Your new post is live.',
      });
      queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] }); // Invalidate user-specific posts too
      router.push('/'); 
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast({
        title: 'Error Creating Post',
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
        <CardTitle className="text-2xl font-semibold">Create New Post</CardTitle>
        <CardDescription>Share a photo or video with your followers.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Allow choosing between image or video, or make ImageUploader versatile */}
          {/* For now, let's show both and user picks one */}
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUploader 
              onFileSelect={(file) => handleFileSelect(file, 'image')} 
              initialPreviewUrl={mediaType === 'image' && mediaFile ? URL.createObjectURL(mediaFile) : null}
            />
          </div>
          <div className="text-center text-sm text-muted-foreground">OR</div>
          <div className="space-y-2">
            <Label>Video</Label>
            <VideoUploader 
              onFileSelect={(file) => handleFileSelect(file, 'video')}
              initialPreviewUrl={mediaType === 'video' && mediaFile ? URL.createObjectURL(mediaFile) : null}
            />
          </div>

          <div>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {caption.length} / 2000
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="is-private">Private Post</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            If private, only your followers will see this post.
          </p>

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting || !mediaFile}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
