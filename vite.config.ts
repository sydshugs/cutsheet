/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import Sitemap from 'vite-plugin-sitemap';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

/**
 * Vite dev can send `index.html` through the module transform pipeline when
 * `Sec-Fetch-Dest: script` (or similar) is set; `vite:import-analysis` then
 * tries to parse HTML as JS and throws. Build keeps real HTML for `vite:build-html`.
 */
function devHtmlImportAnalysisGuard(): Plugin {
  let serve = false;
  return {
    name: 'cutsheet:dev-html-import-guard',
    enforce: 'pre',
    configResolved(config) {
      serve = config.command === 'serve';
    },
    transform(_code, id) {
      if (!serve) return null;
      // Vite encodes virtual module NUL as `__x00__` and wraps as `/@id/...` — stubbing those
      // wipes the real HTML→JS entry and leaves a blank page.
      if (
        id.includes('\0') ||
        id.includes('__x00__') ||
        id.includes('/@id/') ||
        id.includes('html-proxy')
      ) {
        return null;
      }
      const pathOnly = id.split('?')[0];
      if (!pathOnly.endsWith('.html')) return null;
      return {code: 'export {}\n', map: null};
    },
  };
}

/**
 * @vitejs/plugin-react registers `load`/`resolveId` with an exact match on `/@react-refresh`.
 * Vite 6 often resolves that URL with a `?t=…` cache-bust query, so the regex fails, the
 * official `load` never runs, and the browser gets the wrong module (no `injectIntoGlobalHook`).
 */
function reactRefreshResolveNormalize(): Plugin {
  return {
    name: 'cutsheet:react-refresh-resolve-normalize',
    enforce: 'pre',
    resolveId(id) {
      const clean = id.split('?')[0].split('#')[0];
      if (clean === '/@react-refresh') return '/@react-refresh';
    },
  };
}

/** Log once at dev start if /api will 404 (Vite does not load .env.example — use .env or .env.local). */
function devApiProxyHint(): Plugin {
  return {
    name: 'cutsheet:dev-api-proxy-hint',
    apply: 'serve',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, '');
      if (env.DEV_API_PROXY_TARGET?.trim()) return;
      config.logger.warn(
        '\n\x1b[33m[!]\x1b[0m DEV_API_PROXY_TARGET is unset — \x1b[1m/api/*\x1b[0m returns 404 with plain Vite.\n' +
          '    Add to \x1b[1m.env.local\x1b[0m: DEV_API_PROXY_TARGET=https://cutsheet.xyz\n' +
          '    Or run: \x1b[1mnpm run dev:vercel\x1b[0m (from repo root). See .env.example.\n',
      );
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  // Plain `vite` does not run Vercel serverless routes. Proxy /api to a deployment
  // (same Supabase project as local env) or run `npm run dev:vercel` instead.
  const devApiProxy = env.DEV_API_PROXY_TARGET?.trim();
  return {
    plugins: [
      devHtmlImportAnalysisGuard(),
      reactRefreshResolveNormalize(),
      devApiProxyHint(),
      react(),
      tailwindcss(),
      // Dev-only: sitemap plugin touched index.html and triggered vite:import-analysis bugs.
      ...(command === 'build'
        ? [
            Sitemap({
              hostname: 'https://cutsheet.xyz',
              dynamicRoutes: ['/app', '/privacy', '/terms'],
              exclude: ['/success', '/s/*', '/demo', '/landing'],
              changefreq: 'weekly',
              priority: 0.7,
              lastmod: new Date().toISOString(),
            }),
          ]
        : []),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },
    optimizeDeps: {
      include: ['remotion', '@remotion/player'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      ...(devApiProxy
        ? {
            proxy: {
              '/api': {
                target: devApiProxy.replace(/\/$/, ''),
                changeOrigin: true,
                secure: true,
              },
            },
          }
        : {}),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'framer-motion': ['framer-motion'],
            'supabase': ['@supabase/supabase-js'],
            'react-markdown': ['react-markdown'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  };
});
