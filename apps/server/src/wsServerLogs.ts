/**
 * WebSocket Server Logs Module
 *
 * This module provides functionality to broadcast server-side console logs to connected WebSocket clients.
 * It overrides the default console methods to both log locally and broadcast to clients.
 * Only active in development mode for debugging purposes.
 *
 * @module wsServerLogs
 */

import superjson from 'superjson';
import { WebSocketLogPayload } from '@carcassonne/shared';
import { ServerWebSocket } from 'bun';

export const connectedClients = new Set<ServerWebSocket<unknown>>();

const broadcastConsole = (type: string, ...args: unknown[]) => {
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

const originalConsole = { ...console };

Object.keys(console).forEach((method) => {
  // @ts-expect-error
  if (typeof console[method] === 'function') {
    // @ts-expect-error
    console[method] = (...args) => {
      // @ts-expect-error
      originalConsole[method](...args);
      broadcastConsole(method, ...args);
    };
  }
});
