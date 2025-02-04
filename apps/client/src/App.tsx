import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { FC, useState } from 'react';
import superjson from 'superjson';
import { Field } from './components/Field';
import { trpc } from './utils/trpc';
import { useServerLogs } from './hooks/useServerLogs';

export const App: FC = () => {
  useServerLogs();

  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: import.meta.env.VITE_API_URL,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center">
          <Field />
          <Toaster visibleToasts={2} expand={true} />
        </div>
      </QueryClientProvider>
    </trpc.Provider>
  );
};
