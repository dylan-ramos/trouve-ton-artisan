import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const indexedRoutes = [
  '/',
  '/mentions-legales',
  '/donnees-personnelles',
  '/accessibilite',
  '/cookies',
];

function staticSeoFiles(siteUrl: string): Plugin {
  const baseUrl = new URL(siteUrl);
  if (!['http:', 'https:'].includes(baseUrl.protocol)) {
    throw new Error('VITE_SITE_URL doit utiliser le protocole HTTP ou HTTPS.');
  }
  const normalizedUrl = baseUrl.href.replace(/\/$/, '');
  return {
    name: 'static-seo-files',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /recherche\nSitemap: ${normalizedUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexedRoutes
          .map(
            (path) =>
              `  <url><loc>${new URL(path, `${normalizedUrl}/`).href}</loc></url>`,
          )
          .join('\n')}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      staticSeoFiles(environment.VITE_SITE_URL ?? 'http://localhost:5173'),
    ],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: environment.VITE_API_PROXY_TARGET ?? 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
