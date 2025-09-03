
import type { AdminUser, UserUpdateRequest, AdminPost, PostUpdatePayload, AdminReel, ReelUpdatePayload, AdminStory, ApiError } from '@/types';
import { getToken } from '@/lib/auth-utils';

const API_BASE_URL = 'http://localhost:8000';

async function fetchApi(url: string, options: RequestInit = {}) {
  const token = getToken();
  const newHeaders = new Headers();

  if (options.headers) {
    const currentHeaders = new Headers(options.headers); 
    currentHeaders.forEach((value, key) => {
      newHeaders.append(key, value);
    });
  }

  if (!newHeaders.has('Content-Type')) {
    newHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    newHeaders.set('Authorization', `Bearer ${token}`);
  }

  const finalOptions: RequestInit = {
    ...options,
    headers: newHeaders,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, finalOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed with status ' + response.status }));
    const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
    console.error(`API Error (${response.status}) for ${url}:`, errorMessage, errorData);
    throw new Error(errorMessage);
  }

  if (response.status === 204) { 
    return null;
  }
  return response.json();
}


export const getUsers = async (skip: number = 0, limit: number = 20): Promise<AdminUser[]> => {
  return fetchApi(`/admin/users?skip=${skip}&limit=${limit}`);
};

export const getUserById = async (userId: number): Promise<AdminUser> => {
  return fetchApi(`/admin/users/${userId}`);
};

export const updateUser = async (userId: number, userData: UserUpdateRequest): Promise<AdminUser> => {
  return fetchApi(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (userId: number): Promise<{ detail: string } | null> => {
  return fetchApi(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
};

export const getAdminPosts = async (skip: number = 0, limit: number = 20): Promise<AdminPost[]> => {
  return fetchApi(`/admin/posts?skip=${skip}&limit=${limit}`);
};

export const adminGetPostById = async (postId: number): Promise<AdminPost> => {
  return fetchApi(`/admin/posts/${postId}`);
};

export const adminUpdatePost = async (postId: number, postData: PostUpdatePayload): Promise<AdminPost> => {
  return fetchApi(`/admin/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  });
};

export const adminDeletePost = async (postId: number): Promise<{ detail: string } | null> => {
  return fetchApi(`/admin/posts/${postId}`, {
    method: 'DELETE',
  });
};

export const getAdminReels = async (skip: number = 0, limit: number = 20): Promise<AdminReel[]> => {
  return fetchApi(`/admin/reels?skip=${skip}&limit=${limit}`);
};

export const adminGetReelById = async (reelId: number): Promise<AdminReel> => {
  return fetchApi(`/admin/reels/${reelId}`);
};

export const adminUpdateReel = async (reelId: number, reelData: ReelUpdatePayload): Promise<AdminReel> => {
  return fetchApi(`/admin/reels/${reelId}`, {
    method: 'PUT',
    body: JSON.stringify(reelData),
  });
};

export const adminDeleteReel = async (reelId: number): Promise<{ detail: string } | null> => {
  return fetchApi(`/admin/reels/${reelId}`, {
    method: 'DELETE',
  });
};

export const getAdminStories = async (skip: number = 0, limit: number = 20): Promise<AdminStory[]> => {
  return fetchApi(`/admin/stories?skip=${skip}&limit=${limit}`);
};

export const adminGetStoryById = async (storyId: number): Promise<AdminStory> => {
  return fetchApi(`/admin/stories/${storyId}`);
};

export const adminDeleteStory = async (storyId: number): Promise<{ detail: string } | null> => {
  return fetchApi(`/admin/stories/${storyId}`, {
    method: 'DELETE',
  });
};
