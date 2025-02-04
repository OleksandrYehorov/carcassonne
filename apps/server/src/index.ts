import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router';
import { ServerWebSocket } from 'bun';
import superjson from 'superjson';
import { WebSocketLogPayload } from '@carcassonne/shared';

const port = Number(Bun.env.PORT);

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin':
    Bun.env.MODE === 'production'
      ? Bun.env.CLIENT_URL!
      : 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
};

const connectedClients = new Set<ServerWebSocket<unknown>>();

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

const broadcastLog = (type: string, ...args: unknown[]) => {
  // Only broadcast logs in development mode

  if (Bun.env.MODE !== 'development') return;

  const message = {
    type,
    timestamp: new Date(),
    args,
  } satisfies WebSocketLogPayload;

  connectedClients.forEach((client) => {
    client.send(superjson.stringify(message));
  });
};

console.log = (...args) => {
  originalConsole.log(...args);
  broadcastLog('log', ...args);
};

console.error = (...args) => {
  originalConsole.error(...args);
  broadcastLog('error', ...args);
};

console.warn = (...args) => {
  originalConsole.warn(...args);
  broadcastLog('warn', ...args);
};

console.info = (...args) => {
  originalConsole.info(...args);
  broadcastLog('info', ...args);
};

Bun.serve({
  port,
  websocket: {
    open(ws) {
      connectedClients.add(ws);
    },
    close(ws) {
      connectedClients.delete(ws);
    },
    message() {},
  },
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === '/ws') {
      const success = server.upgrade(req);
      if (success) return;
      return new Response('WebSocket upgrade error', { status: 400 });
    }

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
  `🚀 Server running in ${Bun.env.MODE || 'development'} mode on port ${port}`
);
