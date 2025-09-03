
import type { Control } from "react-hook-form"; // For Genkit forms, if needed

// --- User Related Types ---
export interface User {
  id: number;
  username: string;
  profile_picture?: string | undefined;
  name?: string | null;
  bio?: string | null;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  reelsCount?: number;
  stories?: Story[];
  hasActiveStory?: boolean;
  email: string;
  is_active?: boolean | null;
  is_admin?: boolean;
  is_private?: boolean; // Added
  full_name?: string | null;
  created_at?: string | null; // ISO date string
  isFollowedByCurrentUser?: boolean;
}

export interface UserOut {
  id: number;
  username: string;
  email: string;
  profile_picture?: string | undefined;
  full_name?: string | null;
  bio?: string | null;
  is_active?: boolean | null;
  is_admin?: boolean;
  is_private?: boolean; // Added
  created_at?: string | null; // ISO date string
  followers_count?: number;
  following_count?: number;
  is_followed_by_current_user?: boolean;
}

export type CurrentUser = UserOut;

export type AdminUser = UserOut;

export interface UserUpdateRequest { // For PUT /admin/users/{user_id}
  email?: string;
  username?: string;
  full_name?: string;
  bio?: string;
  profile_picture?: string;
  is_private?: boolean; // Added
}

// For user's own profile update (usually FormData for picture)
export interface MyProfileUpdateRequest {
  username?: string;
  email?: string;
  full_name?: string;
  bio?: string;
  is_private?: boolean; // Added
}


// --- Story Related Types ---
export interface Story {
  id: number;
  media_url: string;
  owner_id: number;
  created_at: string;
  expires_at: string;
  owner: UserOut;
}

export interface StoryOut {
  id: number;
  media_url: string;
  owner_id: number;
  created_at: string;
  expires_at: string;
  owner: UserOut;
}

export type AdminStory = StoryOut;


// --- Post Related Types ---
export interface PostCreatePayload {
  caption?: string | null;
  is_private?: boolean;
}

export interface PostUpdatePayload {
  caption?: string | null;
  is_private?: boolean;
}

export interface PostOut {
  id: number;
  caption?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  is_private: boolean;
  owner_id: number;
  created_at: string;
  like_count: number;
  comment_count: number;
  owner: UserOut;
  is_liked_by_current_user?: boolean;
  comments?: Comment[];
}

export type Post = PostOut;

export type AdminPost = PostOut;


// --- Reel Related Types ---
export interface Reel {
  id: number;
  video_url: string;
  caption?: string | null;
  owner_id: number;
  created_at: string;
  owner: UserOut;
  like_count?: number;
  comment_count?: number;
  is_liked_by_current_user?: boolean;
  thumbnailUrl?: string;
}

export interface ReelOut {
  id: number;
  video_url: string;
  caption?: string | null;
  owner_id: number;
  created_at: string;
  owner: UserOut;
  like_count?: number;
  comment_count?: number;
  is_liked_by_current_user?: boolean;
}

export type AdminReel = ReelOut;

export interface ReelUpdatePayload {
  caption?: string | null;
}


// --- Comment Related Types ---
export interface CommentCreate {
  content: string;
}

export interface CommentBrief {
  id: number;
  content: string;
  user_id: number; // ID of the user who wrote the comment
  post_id?: number | null;
  reel_id?: number | null;
  parent_id?: number | null;
  created_at: string;
  user: UserOut; // User object for the author of the comment
}

export interface Comment {
  id: number;
  content: string;
  user_id: number; // ID of the user who wrote the comment
  post_id?: number | null;
  reel_id?: number | null;
  parent_id?: number | null;
  created_at: string;
  replies?: CommentBrief[];
  user: UserOut; // User object for the author of the comment
}


// --- Notification Related Type ---
export interface Notification {
  id: number;
  user_id: number;
  sender_id: number;
  type: 'like' | 'comment' | 'follow' | 'new_post' | 'mention' | string;
  post_id?: number | null;
  reel_id?: number | null; // Added to match backend potential
  comment_id?: number | null;
  created_at: string;
  read: boolean;
  sender: UserOut;
  post?: PostOut | null;
  reel?: ReelOut | null; // Added to match backend potential
  comment?: Comment | null; // Comment object (which now has a .user field for its author)
}


// --- Authentication Specific Types ---
export interface UserCreateRequest {
  username: string;
  email: string;
  full_name?: string | null;
  password: string;
  is_private?: boolean; // Added
}

export interface LoginRequestData {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequestData {
  old_password: string;
  new_password: string;
}

// --- API Interaction Types ---
export interface ApiErrorDetail {
  msg: string;
  type: string;
  loc?: (string | number)[];
}
export interface ApiError {
  detail: string | ApiErrorDetail[] | any;
}

export interface FollowOperationResponse {
  detail: string;
}

// Generic type for paginated responses if backend uses a standard structure
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages?: number;
}

export interface CountResponse {
  count: number;
}
