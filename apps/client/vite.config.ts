import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import checker from 'vite-plugin-checker';
import TanStackRouterVite from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react({
      jsxRuntime: 'automatic',
    }),
    !process.env.VITEST
      ? checker({
          typescript: true,
          eslint: {
            // for example, lint .ts and .tsx
            lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
            useFlatConfig: true,
          },
          overlay: { initialIsOpen: false },
        })
      : undefined,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3777',
      '/api/ws': {
        target: 'ws://localhost:3777',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
