
"use client";

import type { UserOut, PostOut, ApiError } from '@/types';
import { getToken } from '@/lib/auth-utils';

const API_BASE_URL = 'http://localhost:8000';

async function fetchSearchApi(endpoint: string, options: RequestInit = {}, requiresAuth: boolean = false) {
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

  if (requiresAuth) {
    const token = getToken();
    if (token) {
      newHeaders.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn(`Auth token missing for protected search endpoint: ${endpoint}`);
    }
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


export const searchUsers = async (query: string, skip: number = 0, limit: number = 10): Promise<UserOut[]> => {
  if (!query.trim()) return [];
  return fetchSearchApi(`/search/users?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`);
};

export const searchPosts = async (query: string, skip: number = 0, limit: number = 10): Promise<PostOut[]> => {
  if (!query.trim()) return [];
  return fetchSearchApi(`/search/posts?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`, {}, true); // Requires auth
};


export const getTrendingPosts = async (skip: number = 0, limit: number = 10): Promise<PostOut[]> => {
  return fetchSearchApi(`/search/trending?skip=${skip}&limit=${limit}`);
};

export const getRecommendedUsers = async (skip: number = 0, limit: number = 5): Promise<UserOut[]> => {
  return fetchSearchApi(`/search/recommended-users?skip=${skip}&limit=${limit}`, {}, true); // Requires auth
};
