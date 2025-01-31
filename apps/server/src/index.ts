import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router';

const port = Number(Bun.env.PORT);

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL!
      : 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
};

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Handle tRPC requests
    if (url.pathname.startsWith('/trpc')) {
      try {
        const response = await fetchRequestHandler({
          endpoint: '/trpc',
          req,
          router: appRouter,
          onError: ({ error, path }) => {
            console.error(`Error in tRPC handler ${path}:`, error);
          },
        });

        // Add CORS headers to the response
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        return response;
      } catch (error) {
        console.error('tRPC request handler error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(
  `🚀 Server running in ${
    Bun.env.NODE_ENV || 'development'
  } mode on port ${port}`
);
