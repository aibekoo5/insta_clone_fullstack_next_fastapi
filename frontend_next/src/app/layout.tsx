
"use client"; 

import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/layout/navbar';
import { APP_NAME } from '@/lib/constants';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { usePathname } from 'next/navigation';
import { AppProviders } from '@/components/layout/providers'; // Import the new Providers component

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

// It's generally better to handle dynamic titles and descriptions via Next.js metadata API
// in Server Components or specific page metadata, rather than useEffect in RootLayout.
// export const metadata: Metadata = { 
//   title: APP_NAME,
//   description: `Frontend for ${APP_NAME}, an Instagram clone built with Next.js.`,
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const showNavbar = !isAuthRoute && !isAdminRoute;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <AppProviders>
          <div className="relative flex min-h-screen flex-col">
            {showNavbar && <Navbar />}
            <main className={cn(
                "flex-1",
                (showNavbar && !isAdminRoute) ? "container max-w-screen-lg mx-auto py-6 px-4 sm:px-6 lg:px-8" : ""
            )}>
              {children}
            </main>
          </div>
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} />
        </AppProviders>
      </body>
    </html>
  );
}
