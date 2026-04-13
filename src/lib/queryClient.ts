import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale after 2 minutes — reasonable for user profile/credits
      staleTime: 2 * 60 * 1000,
      // Cache for 5 minutes after component unmount
      gcTime: 5 * 60 * 1000,
      // Don't refetch on window focus for analysis-heavy app
      refetchOnWindowFocus: false,
      // Retry once on failure, not 3 times
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
