import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  server: {
    hmr: {
      overlay: false,
    },
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  build: {
    modulePreload: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'react-router-vendor';
          }
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'firebase-vendor';
          }
          if (id.includes('node_modules/socket.io-client/') || id.includes('node_modules/engine.io-client/')) {
            return 'socket-vendor';
          }
          if (id.includes('node_modules/@monaco-editor/') || id.includes('node_modules/monaco-editor/')) {
            return 'monaco-vendor';
          }
          if (
            id.includes('node_modules/@tensorflow/') ||
            id.includes('node_modules/@mediapipe/') ||
            id.includes('node_modules/@tensorflow-models/')
          ) {
            return 'ml-vendor';
          }
          if (
            id.includes('node_modules/lucide-react/') ||
            id.includes('node_modules/react-select/') ||
            id.includes('node_modules/react-markdown/') ||
            id.includes('node_modules/remark-gfm/') ||
            id.includes('node_modules/dompurify/')
          ) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/peerjs/') || id.includes('node_modules/webrtc-adapter/')) {
            return 'webrtc-vendor';
          }
          if (id.includes('node_modules/xlsx/')) {
            return 'xlsx-vendor';
          }
        },
      },
    },
    target: 'es2019',
    minify: mode === 'production' ? 'terser' : 'esbuild',
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
        inline: 2,
      },
      mangle: {
        safari10: true,
      },
    } : undefined,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'buffer'],
    force: false,
  },
  esbuild: {
    target: 'es2019',
    drop: [],
  },
}))