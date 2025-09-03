
import type { ApiError, Comment, CommentCreate, CommentBrief, FollowOperationResponse, UserOut } from '@/types';
import { getToken } from '@/lib/auth-utils';
import { User } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

async function fetchEngagementApi(endpoint: string, options: RequestInit = {}) {
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({ detail: 'Request failed with status ' + response.status }));
    const message = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
    if (!(response.status === 400 && (message.includes("Post already liked") || message.includes("Reel already liked")))) {
        console.error(`API Error (${response.status}) for ${endpoint}:`, message);
    }
    throw new Error(message);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") { 
    return null;
  }
  return response.json();
}


export const likePost = async (postId: string | number): Promise<{ detail: string } | null> => {
  return fetchEngagementApi(`/engagement/posts/${postId}/like`, { method: 'POST' });
};

export const unlikePost = async (postId: string | number): Promise<{ detail: string } | null> => {
  return fetchEngagementApi(`/engagement/posts/${postId}/unlike`, { method: 'POST' });
};


export const likeReel = async (reelId: number | string): Promise<{ detail: string } | null> => {
  return fetchEngagementApi(`/engagement/reels/${reelId}/like`, { method: 'POST' });
};

export const unlikeReel = async (reelId: number | string): Promise<{ detail: string } | null> => {
  return fetchEngagementApi(`/engagement/reels/${reelId}/unlike`, { method: 'POST' });
};



export const createCommentForPost = async (postId: string | number, commentData: CommentCreate): Promise<CommentBrief> => {
  return fetchEngagementApi(`/engagement/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
};

export const getCommentsForPost = async (postId: string | number, skip: number = 0, limit: number = 10): Promise<Comment[]> => {
  return fetchEngagementApi(`/engagement/posts/${postId}/comments?skip=${skip}&limit=${limit}`);
};

export const deleteCommentById = async (commentId: number): Promise<{ detail: string } | null> => {
  return fetchEngagementApi(`/engagement/comments/${commentId}`, { method: 'DELETE' });
};


export const createCommentForReel = async (reelId: number, commentData: CommentCreate): Promise<CommentBrief> => {
  console.warn("createCommentForReel API call not fully implemented yet. Using placeholder.");
  const placeholderComment: CommentBrief = {
    id: Date.now(),
    content: commentData.content,
    user_id: 0, 
    reel_id: reelId,
    post_id: null, 
    parent_id: undefined, 
    created_at: new Date().toISOString(),
    user: {} as UserOut,
  };
  return Promise.resolve(placeholderComment);
};

export const getCommentsForReel = async (reelId: number, skip: number = 0, limit: number = 10): Promise<Comment[]> => {
  console.warn("getCommentsForReel API call not fully implemented yet.");
  return Promise.resolve([]);
};

export const deleteReelComment = async (commentId: number): Promise<{ detail: string } | null> => {
  console.warn("deleteReelComment API call not fully implemented yet.");
  return Promise.resolve({ detail: "Reel comment deletion not fully implemented." });
};


export const followUser = async (userIdToFollow: string | number): Promise<FollowOperationResponse | null> => {
  return fetchEngagementApi(`/follow/${userIdToFollow}`, { method: 'POST' });
};

export const unfollowUser = async (userIdToUnfollow: string | number): Promise<FollowOperationResponse | null> => {
  return fetchEngagementApi(`/follow/${userIdToUnfollow}/unfollow`, { method: 'POST' });
};

export const getFollowers = async (userId: string | number, skip: number = 0, limit: number = 10): Promise<UserOut[]> => {
  return fetchEngagementApi(`/follow/${userId}/followers?skip=${skip}&limit=${limit}`);
};

export const getFollowing = async (userId: string | number, skip: number = 0, limit: number = 10): Promise<UserOut[]> => {
  return fetchEngagementApi(`/follow/${userId}/following?skip=${skip}&limit=${limit}`);
};
