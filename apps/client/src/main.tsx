import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { trpc } from './utils/trpc';

import './index.css';

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL}${
        import.meta.env.VITE_TRPC_ENDPOINT
      }`,
    }),
  ],
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
