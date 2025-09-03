
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Post } from '@/types';
import { getFeedPosts } from '@/services/post-api'; // Assuming your API service

interface PostsState {
  items: Post[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null | undefined;
}

const initialState: PostsState = {
  items: [],
  status: 'idle',
  error: null,
};

// Async thunk for fetching feed posts
export const fetchFeedPosts = createAsyncThunk<
  Post[], // Return type of the payload
  { skip?: number; limit?: number; include_private?: boolean }, // Argument type
  { rejectValue: string } // Type for thunkAPI.rejectWithValue
>('posts/fetchFeedPosts', async (params, { rejectWithValue }) => {
  try {
    const posts = await getFeedPosts(params.skip, params.limit, params.include_private);
    return posts;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch posts');
  }
});

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // You can add other reducers here for adding, updating, deleting posts locally if needed
    // e.g., addPost: (state, action: PayloadAction<Post>) => { ... }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedPosts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFeedPosts.fulfilled, (state, action: PayloadAction<Post[]>) => {
        state.status = 'succeeded';
        state.items = action.payload; // Replace current items with fetched items
      })
      .addCase(fetchFeedPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // Error message from rejectWithValue
      });
  },
});

// Export selectors
export const selectAllPosts = (state: { posts: PostsState }) => state.posts.items;
export const getPostsStatus = (state: { posts: PostsState }) => state.posts.status;
export const getPostsError = (state: { posts: PostsState }) => state.posts.error;

export default postsSlice.reducer;
