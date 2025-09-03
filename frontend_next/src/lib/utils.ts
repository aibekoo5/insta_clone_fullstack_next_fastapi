import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE_URL = 'http://lifegram_backend:8000';

export const formatMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  // Replace backslashes with forward slashes
  const pathWithForwardSlashes = url.replace(/\\/g, '/');
  // Check if it's already an absolute URL
  if (pathWithForwardSlashes.startsWith('http://') || pathWithForwardSlashes.startsWith('https://')) {
    return pathWithForwardSlashes;
  }
  // Prepend API_BASE_URL if it's a relative path
  // Ensure there's only one slash between API_BASE_URL and the path
  const apiBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const relativePath = pathWithForwardSlashes.startsWith('/') ? pathWithForwardSlashes : `/${pathWithForwardSlashes}`;
  
  return `${apiBase}${relativePath}`;
};
