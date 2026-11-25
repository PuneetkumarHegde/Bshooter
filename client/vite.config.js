import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Generates a PWA manifest from VITE_GAME_NAME so the installed-app name,
 * like everything else, has a single source of truth in the environment.
 */
function pwaManifest(gameName) {
  const manifest = {
    name: gameName,
    short_name: gameName.split(' ')[0] || gameName,
    description: `${gameName} — a colorful bubble shooter. Aim, match, pop, rescue.`,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#121022',
    theme_color: '#121022',
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  };
  return {
    name: 'pwa-manifest',
    // Serve the manifest in dev
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(JSON.stringify(manifest, null, 2));
      });
    },
    // Emit the manifest into the build output
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gameName = env.VITE_GAME_NAME || 'BUBBLE BLAST ADVENTURE';

  return {
    plugins: [react(), pwaManifest(gameName)],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
