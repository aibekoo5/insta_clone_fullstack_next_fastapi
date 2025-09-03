
"use client";

import { CreatePostForm } from '@/components/post/create-post-form';
import type { Metadata } from 'next';
import { useCurrentUser, currentUserQueryKey } from '@/hooks/use-current-user';
import { useIsFetching } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// export const metadata: Metadata = { // Cannot be used in client component
//   title: 'Create New Post',
// };

export default function CreatePostPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const isFetchingCurrentUser = useIsFetching({ queryKey: currentUserQueryKey });

  useEffect(() => {
    if (!isFetchingCurrentUser && currentUser === null) {
      router.push('/login');
    }
  }, [currentUser, isFetchingCurrentUser, router]);

  if (isFetchingCurrentUser || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser && !isFetchingCurrentUser) {
    return null; // Redirection handled by useEffect
  }
  
  return (
    <div className="py-8">
      <CreatePostForm />
    </div>
  );
}
