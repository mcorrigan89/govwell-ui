/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The preview imports the registry's own files through the same aliases a
// consumer's project uses, so what you see is exactly what gets installed.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  // one page with every component on it; not worth splitting
  build: { chunkSizeWarningLimit: 2600 },
  // 5175, so it can run beside Headway's previews; the theme's font
  // URLs point here (REGISTRY_URL in scripts/build-registry.mjs)
  server: { port: 5175, strictPort: true },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/components\/ui\//, replacement: at('./registry/govwell/ui/') },
      { find: /^@\/components\/blocks\//, replacement: at('./registry/govwell/blocks/') },
      { find: /^@\/lib\//, replacement: at('./registry/govwell/lib/') },
      { find: /^@\/hooks\//, replacement: at('./registry/govwell/hooks/') },
      { find: /^@\/docs\//, replacement: at('./src/') },
    ],
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
  },
});
