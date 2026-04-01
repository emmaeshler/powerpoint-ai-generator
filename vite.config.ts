import { defineConfig, Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * Vite plugin that exposes a POST /__shutdown endpoint.
 * When the frontend hits this, the dev server shuts down gracefully
 * and frees the terminal.
 */
function shutdownPlugin(): Plugin {
  return {
    name: 'shutdown-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__shutdown' && req.method === 'POST') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));

          setTimeout(() => {
            console.log('\n\x1b[32m✔\x1b[0m  Server stopped. Your terminal is free.');
            console.log('\x1b[36mℹ\x1b[0m  To start again, run: \x1b[1mnpm start\x1b[0m\n');
            process.exit(0);
          }, 500);
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    shutdownPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
