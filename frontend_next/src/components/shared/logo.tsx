
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants'; // Keep for fallback or default

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge'; // Added 'xlarge'
  className?: string;
  imageUrl?: string;
  text?: string;
  imgAlt?: string;
}

export function Logo({
  size = 'medium',
  className,
  imageUrl,
  text,
  imgAlt = "Logo"
}: LogoProps) {
  const sizeClasses = {
    small: 'h-7', // Height for the logo container
    medium: 'h-8',
    large: 'h-10',
    xlarge: 'h-24', // Added xlarge size (96px)
  };

  const textSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
    xlarge: 'text-4xl', // Added corresponding text size for xlarge
  }

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 text-primary hover:opacity-80 transition-opacity",
        sizeClasses[size],
        className
      )}
      aria-label={`${text || APP_NAME} Home`}
    >
      {imageUrl && (
        <div className={cn("relative", sizeClasses[size], "aspect-square")}>
          <Image
            src={imageUrl}
            alt={imgAlt || text || APP_NAME}
            fill
            className="object-contain"
            data-ai-hint="logo app"
          />
        </div>
      )}
      {text && (
        <span className={cn("font-semibold", textSizeClasses[size], !imageUrl && "ml-1")}>
          {text}
        </span>
      )}
      {!imageUrl && !text && ( // Fallback if no image or text is provided
        <svg
          className={cn("w-auto", sizeClasses[size])} // SVG takes height from parent
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.5 4.5C3.67157 4.5 3 5.17157 3 6V18C3 18.8284 3.67157 19.5 4.5 19.5H19.5C20.3284 19.5 21 18.8284 21 18V6C21 5.17157 20.3284 4.5 19.5 4.5H4.5ZM12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5ZM12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15ZM17.25 9C17.6642 9 18 8.66421 18 8.25C18 7.83579 17.6642 7.5 17.25 7.5C16.8358 7.5 16.5 7.83579 16.5 8.25C16.5 8.66421 16.8358 9 17.25 9Z"
          />
        </svg>
      )}
    </Link>
  );
}
