
// SERVER COMPONENT PART
// No "use client" here

import { getPostById, ApiStatusError } from '@/services/post-api'; // Use getPostById directly
import type { Metadata, ResolvingMetadata } from 'next';
import PostPageClientContent from './PostPageClientContent';
import type { PostOut } from '@/types';

interface SinglePostPageProps {
  params: {
    postId: string;
  };
}

// Alias for clarity in this context, though getPostById is used directly.
const getPostByIdForMetadata = getPostById;

export async function generateMetadata(
  { params }: SinglePostPageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const numericPostId = parseInt(params.postId, 10);
  if (isNaN(numericPostId)) {
    return { title: 'Invalid Post ID' };
  }
  
  // getPostByIdForMetadata (which is getPostById) will now return PostOut | null.
  // It handles 401/404 by returning null. Other errors would still throw and be caught by Next.js.
  const post: PostOut | null = await getPostByIdForMetadata(numericPostId); 
  
  if (!post) {
    // This covers cases where the post is not found (404) or not accessible (401)
    // for metadata generation server-side.
    // The console.error for 401/404 from fetchPostApi is suppressed,
    // and getPostById returns null in these cases.
    return { title: 'Post Not Found' }; // Generic fallback title
  }

  return {
    title: `Post by @${post.owner.username}`,
    description: post.caption?.substring(0, 150) || `View post by ${post.owner.username}`,
    openGraph: {
      title: `Post by @${post.owner.username}`,
      description: post.caption?.substring(0, 150) || `View post by ${post.owner.username}`,
      images: post.image_url ? [{ url: post.image_url }] : [],
    },
  };
}

// Server Component - default export for the page
export default async function SinglePostPage({ params }: SinglePostPageProps) {
  // The Server Component can pass necessary initial data or params to the Client Component.
  // In this case, we mainly need the postId.
  return <PostPageClientContent postIdString={params.postId} />;
}
