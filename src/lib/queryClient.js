import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      // Safety-net polling - most live updates now arrive over the
      // socket.io connection (see SocketContext) and invalidate these
      // caches immediately, so this interval only matters if a socket
      // event was missed (e.g. brief disconnect).
      refetchInterval: 45 * 1000,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
