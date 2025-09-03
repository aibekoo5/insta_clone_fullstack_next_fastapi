
"use client";

import type { StoryOut, ReelOut, ReelUpdatePayload, ApiError } from '@/types';
import { getToken } from '@/lib/auth-utils';

const API_BASE_URL = 'http://localhost:8000';

async function fetchMediaApi(endpoint: string, options: RequestInit = {}, isFormData: boolean = false) {
  const token = getToken();
  const newHeaders = new Headers();

  if (options.headers) {
    const currentHeaders = new Headers(options.headers);
    currentHeaders.forEach((value, key) => {
      newHeaders.append(key, value);
    });
  }

  if (isFormData) {
    newHeaders.delete('Content-Type');
  } else {
    if (!newHeaders.has('Content-Type')) {
      newHeaders.set('Content-Type', 'application/json');
    }
  }
  
  if (token) {
    newHeaders.set('Authorization', `Bearer ${token}`);
  }

  const finalOptions: RequestInit = {
    ...options,
    headers: newHeaders,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({ detail: 'Request failed with status ' + response.status }));
    console.error(`API Error (${response.status}) for ${endpoint}:`, errorData.detail);
    const message = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
    throw new Error(message);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") { 
    return null;
  }
  return response.json();
}

export const uploadStory = async (mediaFile: File): Promise<StoryOut> => {
  const formData = new FormData();
  formData.append('media', mediaFile);
  return fetchMediaApi('/media/stories', { method: 'POST', body: formData }, true);
};

export const getMyStories = async (): Promise<StoryOut[]> => {
  return fetchMediaApi('/media/stories/me');
};

export const getStoriesFromFollowing = async (): Promise<StoryOut[]> => {
  return fetchMediaApi('/media/stories/following');
};

export const deleteStoryById = async (storyId: number): Promise<{ message: string } | null> => {
  return fetchMediaApi(`/media/stories/${storyId}`, { method: 'DELETE' });
};


export const uploadReel = async (videoFile: File, caption?: string): Promise<ReelOut> => {
  const formData = new FormData();
  formData.append('video', videoFile);
  if (caption) {
    formData.append('caption', caption);
  }
  return fetchMediaApi('/media/reels', { method: 'POST', body: formData }, true);
};

export const getAllReels = async (skip: number = 0, limit: number = 10): Promise<ReelOut[]> => {
  return fetchMediaApi(`/media/reels?skip=${skip}&limit=${limit}`);
};

export const getReelsFromFollowing = async (skip: number = 0, limit: number = 10): Promise<ReelOut[]> => {
  return fetchMediaApi(`/media/reels/following?skip=${skip}&limit=${limit}`);
};

export const getUserReels = async (userId: number, skip: number = 0, limit: number = 10): Promise<ReelOut[]> => {
  return fetchMediaApi(`/media/reels/${userId}?skip=${skip}&limit=${limit}`);
};

export const updateReel = async (reelId: number, payload: ReelUpdatePayload, videoFile?: File): Promise<ReelOut> => {
  const formData = new FormData();
  if (payload.caption !== undefined) { 
    formData.append('caption', payload.caption || ''); 
  }
  if (videoFile) {
    formData.append('video', videoFile);
  }
  return fetchMediaApi(`/media/reels/${reelId}`, { method: 'PUT', body: formData }, true);
};

export const deleteReelById = async (reelId: number): Promise<{ message: string } | null> => {
  return fetchMediaApi(`/media/reels/${reelId}`, { method: 'DELETE' });
};
