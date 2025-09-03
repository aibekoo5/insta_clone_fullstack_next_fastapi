
"use client";

import { QueryClient } from '@tanstack/react-query';

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global default options for queries
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Adjust as needed
    },
  },
});

export default queryClient;
