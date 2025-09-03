
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlusSquare, Search as SearchIcon, User as UserIcon, LogOut, Settings, Film, Bell, ImageDown, Clapperboard, CircleDot, UserCog, Languages } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/shared/user-avatar';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { logoutUser } from '@/services/auth-api';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';
import { searchUsers, searchPosts } from '@/services/search-api';
import type { UserOut, PostOut, CurrentUser } from '@/types';
import { SearchResultsDropdown } from '@/components/search/search-results-dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_NAME } from '@/lib/constants';
import { useTranslation } from '@/hooks/use-translation'; 
import type { SupportedLanguage } from '@/contexts/language-context';


const mainNavItems = [
  { href: '/', icon: Home, labelKey: 'navbar_home' },
  { href: '/reels', icon: Film, labelKey: 'navbar_reels' },
];

const CreateDropdownItems = [
  { href: '/post/create', icon: ImageDown, labelKey: 'navbar_create_post' },
  { href: '/reels/create', icon: Clapperboard, labelKey: 'navbar_create_reel' },
  { href: '/stories/create', icon: CircleDot, labelKey: 'navbar_create_story' },
];

const languages: { value: SupportedLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'kk', label: 'Қазақша' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const { t, language, setLanguage } = useTranslation(); 

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const { data: userResults, isLoading: isLoadingUsers } = useQuery<UserOut[], Error>({
    queryKey: ['searchUsers', debouncedSearchQuery],
    queryFn: () => searchUsers(debouncedSearchQuery, 0, 5),
    enabled: !!debouncedSearchQuery.trim() && isSearchFocused && isMounted,
  });

  const { data: postResults, isLoading: isLoadingPosts } = useQuery<PostOut[], Error>({
    queryKey: ['searchPosts', debouncedSearchQuery],
    queryFn: () => searchPosts(debouncedSearchQuery, 0, 5),
    enabled: !!debouncedSearchQuery.trim() && isSearchFocused && isMounted,
  });

  const isLoadingSearch = isLoadingUsers || isLoadingPosts;

  const handleLogout = async () => {
    const { message, error } = await logoutUser();
    if (message) {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      window.location.href = '/login';
    } else {
      toast({ title: "Logout Failed", description: error?.detail as string || "Could not log out.", variant: "destructive" });
      window.location.href = '/login'; 
    }
  };

  const NavLink = ({ href, icon: Icon, labelKey }: { href:string, icon: React.ElementType, labelKey: string}) => {
    const isActive = pathname === href;
    return (
       <Link href={href} passHref legacyBehavior>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-md",
            isActive ? "bg-accent/20 text-primary" : "text-foreground/70 hover:text-foreground"
          )}
          aria-label={t(labelKey)}
        >
          <Icon className="h-6 w-6" />
        </Button>
      </Link>
    );
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchResultsOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    if (debouncedSearchQuery.trim() && isSearchFocused && isMounted) {
      setIsSearchResultsOpen(true);
    } else if (!debouncedSearchQuery.trim()) {
      setIsSearchResultsOpen(false);
    }
  }, [debouncedSearchQuery, isSearchFocused, isMounted]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchResultsOpen(false);
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchResultsRef, searchInputRef]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container grid grid-cols-[auto_1fr_auto] h-16 max-w-screen-lg items-center gap-x-4">

        <div className="flex items-center"> 
           <Logo 
            size="medium" 
            imageUrl="http://localhost:8000/static/logo/Lifegram.png" 
            imgAlt={`${APP_NAME || "App"} Logo`}
            text='Lifegram'
          />
        </div>

        <nav className="hidden sm:flex flex-1 justify-center items-center gap-1 sm:gap-2">
          {mainNavItems.map((item) => (
            <NavLink key={item.labelKey} {...item} />
          ))}
          {isMounted && currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-md text-foreground/70 hover:text-foreground" aria-label={t('navbar_create')}>
                  <PlusSquare className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="center">
                <DropdownMenuLabel>{t('navbar_create')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {CreateDropdownItems.map((item) => (
                    <DropdownMenuItem key={item.labelKey} asChild>
                      <Link href={item.href} className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        {t(item.labelKey)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <div className="flex items-center justify-end gap-1 sm:gap-0"> 
          <div className="hidden md:flex items-center relative">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder={t('navbar_search_placeholder')}
                className="pl-10 h-10 rounded-md bg-muted/50 focus:bg-background w-32 lg:w-40 xl:w-48"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                disabled={!isMounted}
              />
            </form>
            {isMounted && isSearchResultsOpen && (
              <div ref={searchResultsRef}>
                <SearchResultsDropdown
                  users={userResults || []}
                  posts={postResults || []}
                  isLoading={isLoadingSearch}
                  query={debouncedSearchQuery}
                  onClose={() => {
                    setIsSearchResultsOpen(false);
                    setIsSearchFocused(false);
                  }}
                />
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-md text-foreground/70 hover:text-foreground">
                <Languages className="h-6 w-6" />
                <span className="sr-only">{t('language_switcher_label')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('language_switcher_label')}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as SupportedLanguage)}>
                {languages.map((lang) => (
                  <DropdownMenuRadioItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {isMounted && currentUser && <NotificationDropdown />}
          <ThemeToggle />
          {isMounted ? (
            currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <UserAvatar user={currentUser} size="medium" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.full_name || currentUser.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        @{currentUser.username}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${currentUser.username}`} className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      {t('navbar_profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('navbar_settings')}
                    </Link>
                  </DropdownMenuItem>
                  {currentUser.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <UserCog className="mr-2 h-4 w-4" />
                          {t('navbar_admin_panel')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('navbar_logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" passHref legacyBehavior>
                <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('navbar_login')}</Button>
              </Link>
            )
          ) : (
            <div className="h-10 w-10 flex items-center justify-center">
                 <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
