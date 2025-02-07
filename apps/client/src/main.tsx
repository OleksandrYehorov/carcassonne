import { trpc } from '@/utils/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import {
  httpBatchLink,
  splitLink,
  unstable_httpSubscriptionLink,
} from '@trpc/client';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import superjson from 'superjson';
import './index.css';
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: import.meta.env.MODE !== 'development',
      refetchOnReconnect: import.meta.env.MODE !== 'development',
    },
  },
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const trpcClient = trpc.createClient({
  links: [
    // loggerLink(),
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: unstable_httpSubscriptionLink({
        url: '/api/trpc',
        transformer: superjson,
      }),
      false: httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        },
      }),
    }),
  ],
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster visibleToasts={2} expand={true} />
    </QueryClientProvider>
  </trpc.Provider>
);
