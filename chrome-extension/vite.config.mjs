import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        { src: './manifest.json', dest: '.' },
        { src: './content.js', dest: '.' },
        { src: './background.js', dest: '.' },
        { src: './popup.html', dest: '.' },
        { src: './popup.js', dest: '.' },
        { src: './src/globals.css', dest: '.' },
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
   
        'main': resolve(__dirname, 'src/main.tsx'), // General content script for content injection
      },
      output: {
        format: 'iife',
        sourcemap: true,
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background/index.js';
          if (chunk.name === 'content/whatsapp') return 'content/whatsapp.js';
          if (chunk.name === 'content/linkedin') return 'content/linkedin.js';
          if (chunk.name === 'sidebar-content-mount') return 'sidebar-content-mount.js';
          if (chunk.name === 'popup/index') return 'popup/index.js';
          if (chunk.name === 'main') return 'main.js';
          return '[name].js';
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  resolve: { dedupe: ['react', 'react-dom'] },
});
