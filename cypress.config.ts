const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173', // Vite's default port
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
