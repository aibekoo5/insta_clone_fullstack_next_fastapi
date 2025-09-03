
"use client";

import { useState, ChangeEvent, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, XCircle, Video as VideoIcon } from 'lucide-react'; // Using VideoIcon for placeholder

interface VideoUploaderProps {
  onFileSelect: (file: File | null) => void;
  initialPreviewUrl?: string | null; // Might be a thumbnail URL if editing
}

export function VideoUploader({ onFileSelect, initialPreviewUrl = null }: VideoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file); // This creates a data URL for preview
      onFileSelect(file);
    } else {
      // Handle non-video file or no file
      handleRemoveVideo();
      if(file) { // if a file was selected but not a video
        alert("Please select a video file (e.g., MP4, MOV, AVI).");
      }
    }
  };

  const handleRemoveVideo = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setFileName(null);
    onFileSelect(null);
    if (videoRef.current) {
      videoRef.current.src = ''; // Clear video source
    }
    const fileInput = document.getElementById('video-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="video-upload-input" className="block text-sm font-medium text-foreground mb-1">
        Upload Video
      </Label>
      <div 
        className="relative flex justify-center items-center w-full h-64 sm:h-96 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors group bg-muted/20"
        onClick={() => document.getElementById('video-upload-input')?.click()}
      >
        <Input
          id="video-upload-input"
          type="file"
          accept="video/*" // Accept all video types
          onChange={handleFileChange}
          className="sr-only"
        />
        {previewUrl && selectedFile ? (
          <>
            {/* Basic video preview. Controls allow user to play/pause. */}
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="max-h-full max-w-full rounded-md object-contain"
              data-ai-hint="video preview"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); handleRemoveVideo(); }}
              aria-label="Remove video"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
              Click to upload or drag and drop video
            </p>
            <p className="text-xs text-muted-foreground">MP4, MOV, WebM, etc.</p>
          </div>
        )}
      </div>
      {fileName && !previewUrl && ( // Show filename if preview isn't available but file selected
         <div className="text-sm text-muted-foreground flex items-center justify-center">
            <VideoIcon className="h-4 w-4 mr-2" />
            <span>{fileName}</span>
        </div>
      )}
    </div>
  );
}
