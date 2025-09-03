
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: Partial<User> & { username: string }; // Requires username, allows other partial User fields
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'story';
  className?: string;
}

const API_BASE_URL = 'http://localhost:8000';

export function UserAvatar({ user, size = 'medium', className }: UserAvatarProps) {
  const getInitials = (name?: string | null, username?: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const sizeClasses = {
    small: 'h-8 w-8 text-xs', // 32px
    medium: 'h-10 w-10 text-sm', // 40px
    story: 'h-14 w-14 text-base', // 56px
    large: 'h-16 w-16 text-lg', // 64px (formerly large, for post headers)
    xlarge: 'h-32 w-32 text-3xl', // 128px For profile page main avatar
  };

  let imageUrl = user.profile_picture || undefined;

  if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    // If it's a relative path (e.g., "static/..." or "/static/...")
    // Ensure no double slashes if imageUrl already starts with "/"
    if (imageUrl.startsWith('/')) {
      imageUrl = `${API_BASE_URL}/static/${imageUrl}`;
    } else {
      imageUrl = `${API_BASE_URL}/${imageUrl}`;
    }
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={`${imageUrl}`} alt={user.full_name || user.username} data-ai-hint="profile picture" />
      <AvatarFallback className={cn(sizeClasses[size], 'font-medium')}>
        {getInitials(user.full_name || undefined, user.username)}
      </AvatarFallback>
    </Avatar>
  );
}
