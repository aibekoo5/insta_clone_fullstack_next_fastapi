
"use client";

import { useState, ChangeEvent } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, XCircle } from 'lucide-react';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  initialPreviewUrl?: string | null;
}

export function ImageUploader({ onFileSelect, initialPreviewUrl = null }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    } else {
      handleRemoveImage();
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    onFileSelect(null);
    // Reset file input value if needed
    const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="image-upload-input" className="block text-sm font-medium text-foreground mb-1">
        Upload Image
      </Label>
      <div 
        className="relative flex justify-center items-center w-full h-64 sm:h-96 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors group bg-muted/20"
        onClick={() => document.getElementById('image-upload-input')?.click()}
      >
        <Input
          id="image-upload-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Selected preview"
              layout="fill"
              objectFit="contain"
              className="rounded-md"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
              aria-label="Remove image"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
      </div>
      {/* Note: react-dropzone can be integrated here for drag & drop functionality. */}
    </div>
  );
}
