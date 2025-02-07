import { WebSocketLogPayload } from '@carcassonne/shared';
import { useEffect } from 'react';
import superjson from 'superjson';

export const useServerLogs = () => {
  useEffect(() => {
    // Only connect to WebSocket in development mode
    if (import.meta.env.MODE !== 'development') return;

    const ws = new WebSocket('/api/ws');

    ws.addEventListener('message', (event) => {
      try {
        const { args, timestamp, type } = superjson.parse(
          event.data
        ) as WebSocketLogPayload;

        const time = new Date(timestamp).toLocaleTimeString();

        // @ts-expect-error: ignore TS error
        if (typeof console[type] === 'function') {
          // @ts-expect-error: ignore TS error
          console[type]?.(`[Server ${time}]`, ...args);
        }
      } catch (error) {
        console.error('Failed to parse server log:', error);
      }
    });

    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      ws.close();
    };
  }, []);
};
