import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function landingDevRedirect(): Plugin {
  return {
    name: 'landing-dev-redirect',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url === '/') {
          response.statusCode = 302;
          response.setHeader('Location', '/landing.html');
          response.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [landingDevRedirect(), react()],
  build: {
    outDir: 'dist-landing',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'landing.html'),
      },
    },
  },
});
