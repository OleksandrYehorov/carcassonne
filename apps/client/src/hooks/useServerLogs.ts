import { WebSocketLogPayload } from '@carcassonne/shared';
import { useEffect } from 'react';
import superjson from 'superjson';

export const useServerLogs = () => {
  useEffect(() => {
    // Only connect to WebSocket in development mode
    if (import.meta.env.MODE !== 'development') return;

    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.addEventListener('message', (event) => {
      try {
        const { args, timestamp, type } = superjson.parse(
          event.data
        ) as WebSocketLogPayload;

        const time = new Date(timestamp).toLocaleTimeString();

        switch (type) {
          case 'log':
            console.log(`[Server ${time}]`, ...args);
            break;
          case 'error':
            console.error(`[Server ${time}]`, ...args);
            break;
          case 'warn':
            console.warn(`[Server ${time}]`, ...args);
            break;
          case 'info':
            console.info(`[Server ${time}]`, ...args);
            break;
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
