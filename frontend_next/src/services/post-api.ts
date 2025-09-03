
// Removed "use client"; to allow server-side usage for generateMetadata

import type { PostOut, PostUpdatePayload, ApiError } from '@/types';
import { getToken } from '@/lib/auth-utils';

const API_BASE_URL = 'http://localhost:8000';

// Custom error for API responses
export class ApiStatusError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiStatusError';
    this.status = status;
  }
}

// Helper function to handle API requests for posts
async function fetchPostApi(endpoint: string, options: RequestInit = {}, isFormData: boolean = false) {
  const token = getToken(); // Returns null on server, a token string or null on client
  const newHeaders = new Headers();

  // Safely append headers from options.headers
  if (options.headers) {
    const currentHeaders = new Headers(options.headers);
    currentHeaders.forEach((value, key) => {
      newHeaders.append(key, value);
    });
  }
  
  // Content-Type logic based on isFormData
  if (isFormData) {
    const contentType = newHeaders.get('Content-Type')?.toLowerCase();
    if (contentType && contentType !== 'multipart/form-data' && !contentType.startsWith('multipart/form-data')) {
      newHeaders.delete('Content-Type');
    }
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
    const message = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
    // Conditionally log error. Do not log for 401 or 404 as these might be handled by returning null or specific fallbacks.
    if (response.status !== 401 && response.status !== 404) {
      console.error(`API Error (${response.status}) for ${endpoint}:`, message);
    }
    throw new ApiStatusError(message, response.status);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }
  return response.json();
}

// --- Post Operations ---

export const createNewPost = async (formData: FormData): Promise<PostOut> => {
  return fetchPostApi('/posts/', { method: 'POST', body: formData }, true);
};

export const getFeedPosts = async (skip: number = 0, limit: number = 10, include_private: boolean = false): Promise<PostOut[]> => {
  return fetchPostApi(`/posts/?skip=${skip}&limit=${limit}&include_private=${include_private}`);
};

export const getUserPosts = async (userId: number, skip: number = 0, limit: number = 10): Promise<PostOut[]> => {
  return fetchPostApi(`/posts/${userId}?skip=${skip}&limit=${limit}`);
};

export const getPostById = async (postId: number): Promise<PostOut | null> => {
  try {
    const post = await fetchPostApi(`/posts/post/${postId}`);
    return post as PostOut; // fetchPostApi can return null for 204, ensure type compatibility
  } catch (error) {
    if (error instanceof ApiStatusError && (error.status === 401 || error.status === 404)) {
      // For these specific errors, we return null to indicate the post is not accessible/found.
      // The console.error for these statuses is suppressed in fetchPostApi.
      return null;
    }
    throw error; // Re-throw other errors
  }
};

export const updateExistingPost = async (postId: number, postData: PostUpdatePayload): Promise<PostOut> => {
  return fetchPostApi(`/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  });
};

export const deleteExistingPost = async (postId: number): Promise<{ message: string } | null> => {
  return fetchPostApi(`/posts/${postId}`, { method: 'DELETE' });
};
