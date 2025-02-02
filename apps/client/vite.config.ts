import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import checker from 'vite-plugin-checker';
export default defineConfig({
  plugins: [
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
});
