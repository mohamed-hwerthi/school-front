import { QueryClient } from "@tanstack/react-query";
import env from "./env";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: env.isDev ? 0 : 5 * 60 * 1000, // 0 in dev, 5min in prod
      retry: env.isDev ? false : 2,
      refetchOnWindowFocus: env.isProd,
    },
    mutations: {
      retry: false,
    },
  },
});
