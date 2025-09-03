
"use client";

import { useEffect } from 'react';
import type { CurrentUser, UserOut } from '@/types';
import { getToken, getCurrentUserFromStorage, setCurrentUserInStorage, removeCurrentUserFromStorage, removeToken } from '@/lib/auth-utils';
import { getMyProfile } from '@/services/auth-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const currentUserQueryKey = ['currentUser'];

export function useCurrentUser(): CurrentUser | null | undefined { // Return undefined while loading
  const queryClient = useQueryClient();
  
  const { data: currentUser, isLoading } = useQuery<CurrentUser | null>({
    queryKey: currentUserQueryKey,
    queryFn: async () => {
      const token = getToken();
      if (token) {
        const storedUser = getCurrentUserFromStorage();
        if (storedUser) {
          // To ensure freshness or validate token, we could re-fetch here,
          // but for now, if storedUser exists with token, we trust it initially.
          // A robust app might always call getMyProfile if token exists.
           try {
            const { user: fetchedUser, error } = await getMyProfile();
            if (fetchedUser) {
              setCurrentUserInStorage(fetchedUser);
              return fetchedUser as CurrentUser;
            }
            if (error) {
              console.warn("Session invalid or failed to refresh user details:", error.detail);
              removeToken();
              removeCurrentUserFromStorage();
              return null;
            }
          } catch (e) {
            console.warn("Error during getMyProfile in useCurrentUser:", e);
            removeToken();
            removeCurrentUserFromStorage();
            return null;
          }
        }
        // If no stored user but token exists, fetch (e.g. first load after login or token refresh)
        try {
            const { user: fetchedUser, error } = await getMyProfile();
            if (fetchedUser) {
              setCurrentUserInStorage(fetchedUser);
              return fetchedUser as CurrentUser;
            }
            if (error) { // Token might be invalid
              console.warn("Failed to fetch current user details with token:", error.detail);
              removeToken();
              removeCurrentUserFromStorage();
              return null;
            }
        } catch (e) {
            console.warn("Error during getMyProfile in useCurrentUser (no stored user):", e);
            removeToken();
            removeCurrentUserFromStorage();
            return null;
        }
      }
      // No token, ensure local storage is clean
      removeCurrentUserFromStorage(); 
      return null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'instanext_access_token' || event.key === 'instanext_current_user') {
        queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);

  if (isLoading) {
    return undefined; // Explicitly return undefined during loading
  }

  return currentUser ?? null;
}
