import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router';
import { createContext } from './trpc';
import { connectedClients } from './wsServerLogs';
import path from 'path';
import fs from 'fs';

const port = Number(Bun.env.PORT);
const clientBuildPath = path.join(__dirname, '../../client/dist');

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

    // Handle WebSocket connections
    if (url.pathname.startsWith('/api/ws')) {
      const success = server.upgrade(req);
      if (success) return;
      return new Response('WebSocket upgrade error', { status: 400 });
    }

    // Handle tRPC requests
    if (url.pathname.startsWith('/api/trpc')) {
      try {
        const response = await fetchRequestHandler({
          endpoint: '/api/trpc',
          req,
          router: appRouter,
          onError: ({ error, path }) => {
            console.error(`Error in tRPC handler ${path}:`, error);
          },
          createContext,
        });

        return response;
      } catch (error) {
        console.error('tRPC request handler error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    // Serve static files for React app
    try {
      let filePath = path.join(
        clientBuildPath,
        url.pathname === '/' ? 'index.html' : url.pathname
      );

      // If the file doesn't exist, serve index.html for client-side routing
      if (!fs.existsSync(filePath)) {
        filePath = path.join(clientBuildPath, 'index.html');
      }

      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type': getContentType(filePath),
          },
        });
      }
    } catch (error) {
      console.error('Error serving static files:', error);
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(
  `🚀 Server running in ${Bun.env.MODE || 'development'} mode on port ${port}`
);

// Helper function to determine content type
function getContentType(filePath: string): string {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'application/javascript';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}
