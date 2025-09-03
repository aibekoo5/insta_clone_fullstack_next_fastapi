
"use client";

import type { User as FrontendUser } from '@/types'; 
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Settings, UserPlus, UserCheck, Mail, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useState, useEffect } from 'react';
import { followUser, unfollowUser } from '@/services/engagement-api';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';

interface ProfileHeaderProps {
  user: FrontendUser; 
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const isCurrentUserProfile = currentUser?.id === user.id;

  const [isFollowing, setIsFollowing] = useState(!!user.isFollowedByCurrentUser);
  const [optimisticFollowersCount, setOptimisticFollowersCount] = useState(user.followersCount || 0);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  useEffect(() => {
    console.log(`ProfileHeader (user: ${user.username}, id: ${user.id}) useEffect syncing: isFollowedByCurrentUser_FROM_PROP is "${user.isFollowedByCurrentUser}", followersCount_FROM_PROP is "${user.followersCount}". Setting internal states.`);
    setIsFollowing(!!user.isFollowedByCurrentUser);
    setOptimisticFollowersCount(user.followersCount || 0);
  }, [user.isFollowedByCurrentUser, user.followersCount, user.id, user.username]);


  const handleFollowToggle = async () => {
    if (!currentUser || isCurrentUserProfile || isLoadingFollow) return;
    setIsLoadingFollow(true);

    const originalIsFollowing = isFollowing;
    const originalFollowersCount = optimisticFollowersCount;
    const newOptimisticIsFollowing = !originalIsFollowing;
    const newOptimisticFollowersCountChange = newOptimisticIsFollowing ? 1 : -1;
    
    setIsFollowing(newOptimisticIsFollowing);
    setOptimisticFollowersCount(prevCount => Math.max(0, prevCount + newOptimisticFollowersCountChange));
    console.log(`ProfileHeader (user: ${user.username}) OPTIMISTIC update: isFollowing set to ${newOptimisticIsFollowing}, followersCount changed by ${newOptimisticFollowersCountChange}`);

    try {
      if (originalIsFollowing) { 
        await unfollowUser(user.id);
        toast({ title: t('component.profileHeader.toast_unfollowed_title'), description: t('component.profileHeader.toast_unfollowed_description', { username: user.username }) });
      } else { 
        await followUser(user.id);
        toast({ title: t('component.profileHeader.toast_followed_title'), description: t('component.profileHeader.toast_followed_description', { username: user.username }) });
      }
    } catch (error: any) {
      const errorMessage = error.message || t('component.profileHeader.toast_followError_description');
      
      if (errorMessage.toLowerCase().includes("already following")) {
        console.log("ProfileHeader: Caught 'Already following' error. Correcting UI to 'Following'.");
        toast({
          title: t('component.profileHeader.toast_alreadyFollowing_title'),
          description: t('component.profileHeader.toast_alreadyFollowing_description', { username: user.username }),
        });
        setIsFollowing(true);
        if (!originalIsFollowing && originalFollowersCount !== optimisticFollowersCount -1) { // If we optimistically followed and increased count, ensure it's not double counted if server state was already followed
             setOptimisticFollowersCount(originalFollowersCount + 1); // Ensure it reflects at least one follower if initial state was wrong
        } else if (originalIsFollowing) { // if it thought it was following, but error is "already following", that's odd. Revert.
            setOptimisticFollowersCount(originalFollowersCount);
        }

      } else {
        setIsFollowing(originalIsFollowing);
        setOptimisticFollowersCount(originalFollowersCount);
        toast({
          title: t('component.profileHeader.toast_followError_title'),
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingFollow(false);
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.username] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] }); 
    }
  };

  const StatItem = ({ count, labelKey, onClick }: { count: number; labelKey: string; onClick?: () => void }) => (
    <div className={`text-center sm:text-left ${onClick ? 'cursor-pointer hover:underline' : ''}`} onClick={onClick}>
      <span className="font-bold text-lg">{count}</span>
      <span className="text-muted-foreground ml-1">{t(labelKey)}</span>
    </div>
  );

  return (
    <div className="mb-8 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-12">
        <UserAvatar
            user={{ 
                username: user.username,
                profile_picture: user.profile_picture,
                name: user.full_name,
                email: user.email, 
            }}
            size="xlarge"
            className="flex-shrink-0"
        />
        <div className="flex-grow space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:gap-4">
            <h1 className="text-2xl font-light">{user.username}</h1>
            {isCurrentUserProfile ? (
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>{t('component.profileHeader.editProfileButton')}</Button>
              </div>
            ) : currentUser ? ( 
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollowToggle}
                  disabled={isLoadingFollow}
                  className={isFollowing ? "" : "bg-primary hover:bg-primary/90"}
                >
                  {isLoadingFollow ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <UserCheck className="mr-2 h-4 w-4" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {isLoadingFollow ? t('component.profileHeader.processingButton') : isFollowing ? t('component.profileHeader.followingButton') : t('component.profileHeader.followButton')}
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Mail className="mr-2 h-4 w-4" /> {t('component.profileHeader.messageButton')}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-8 my-4">
            <StatItem count={user.postsCount || 0} labelKey="component.profileHeader.stat_posts" />
            <StatItem
              count={optimisticFollowersCount} 
              labelKey="component.profileHeader.stat_followers"
            />
            <StatItem
              count={user.followingCount || 0} 
              labelKey="component.profileHeader.stat_following"
            />
          </div>

          <div>
            {(user.full_name || user.name) && <p className="font-semibold">{user.full_name || user.name}</p>}
            {user.bio && <p className="text-sm text-foreground/80 whitespace-pre-line">{user.bio}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
