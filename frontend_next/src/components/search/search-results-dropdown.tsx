
"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { UserOut, PostOut } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ImageIcon, FileText, Users, SearchSlash } from 'lucide-react';

interface SearchResultsDropdownProps {
  users: UserOut[];
  posts: PostOut[];
  isLoading: boolean;
  query: string;
  onClose: () => void; 
}

export function SearchResultsDropdown({ users, posts, isLoading, query, onClose }: SearchResultsDropdownProps) {
  const hasResults = users.length > 0 || posts.length > 0;

  const handleLinkClick = () => {
    onClose(); // Close dropdown when a link is clicked
  };

  return (
    <div className="absolute top-full mt-2 w-full sm:w-96 max-h-[70vh] bg-popover shadow-xl rounded-md border border-border z-50 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-2">
          {isLoading && (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          )}
          {!isLoading && query && !hasResults && (
            <div className="p-4 text-center text-muted-foreground flex flex-col items-center justify-center h-32">
              <SearchSlash className="w-12 h-12 mb-2 text-muted-foreground/50"/>
              <p className="font-semibold">No results found for &quot;{query}&quot;</p>
              <p className="text-xs">Try a different search term.</p>
            </div>
          )}

          {users.length > 0 && (
            <>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2 py-1.5 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5" /> People
              </h3>
              <ul className="space-y-1">
                {users.map((user) => (
                  <li key={`user-${user.id}`}>
                    <Link 
                      href={`/profile/${user.username}`} 
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors"
                      onClick={handleLinkClick}
                    >
                      <UserAvatar user={user} size="medium" />
                      <div>
                        <p className="text-sm font-semibold text-popover-foreground truncate">{user.username}</p>
                        {user.full_name && <p className="text-xs text-muted-foreground truncate">{user.full_name}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {posts.length > 0 && (
            <>
              {users.length > 0 && <hr className="my-2 border-border/50" />}
              <h3 className="text-xs font-semibold uppercase text-muted-foreground px-2 py-1.5 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Posts
              </h3>
              <ul className="space-y-1">
                {posts.map((post) => (
                  <li key={`post-${post.id}`}>
                    <Link 
                      href={`/post/${post.id}`} 
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors"
                      onClick={handleLinkClick}
                    >
                      <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                        {post.image_url || post.video_url ? (
                          <Image
                            src={post.image_url || post.video_url || "https://placehold.co/40x40.png"}
                            alt={post.caption?.substring(0, 20) || 'Post media'}
                            width={40}
                            height={40}
                            objectFit="cover"
                            className="w-full h-full"
                            data-ai-hint="post thumbnail"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-popover-foreground truncate">
                          {post.caption || `Post by ${post.owner.username}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{post.owner.username}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!isLoading && query && hasResults && (
             <div className="p-2 mt-1 border-t border-border/50">
                <Link 
                    href={`/search?q=${encodeURIComponent(query)}`} 
                    className="block text-center text-sm text-primary hover:underline p-2"
                    onClick={handleLinkClick}
                >
                    View all results for &quot;{query}&quot;
                </Link>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
