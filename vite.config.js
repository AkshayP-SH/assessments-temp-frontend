import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Generate .gz pre-compressed files for all JS/CSS assets
    // Your server (Nginx/CDN) can serve these directly, saving CPU per request
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files > 10 KB
      deleteOriginFile: false, // Keep originals as fallback
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
    // Re-enable module preload — browser prefetches lazy chunks on hover/idle
    modulePreload: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600, // Tightened from 1200 to expose large chunks
    rollupOptions: {
      output: {
        // Manual chunk splitting — separates large vendor libs so they can be
        // cached independently and not re-downloaded on every app update
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // React Router
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'react-router-vendor';
          }
          // Firebase — large SDK, rarely changes
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'firebase-vendor';
          }
          // Socket.io client
          if (id.includes('node_modules/socket.io-client/') || id.includes('node_modules/engine.io-client/')) {
            return 'socket-vendor';
          }
          // Monaco Editor — very large, only used in coding questions
          if (id.includes('node_modules/@monaco-editor/') || id.includes('node_modules/monaco-editor/')) {
            return 'monaco-vendor';
          }
          // TensorFlow + MediaPipe — only loaded during proctored exam
          if (
            id.includes('node_modules/@tensorflow/') ||
            id.includes('node_modules/@mediapipe/') ||
            id.includes('node_modules/@tensorflow-models/')
          ) {
            return 'ml-vendor';
          }
          // UI utilities
          if (
            id.includes('node_modules/lucide-react/') ||
            id.includes('node_modules/react-select/') ||
            id.includes('node_modules/react-markdown/') ||
            id.includes('node_modules/remark-gfm/') ||
            id.includes('node_modules/dompurify/')
          ) {
            return 'ui-vendor';
          }
          // PeerJS for interview rooms
          if (id.includes('node_modules/peerjs/') || id.includes('node_modules/webrtc-adapter/')) {
            return 'webrtc-vendor';
          }
          // Spreadsheet handling
          if (id.includes('node_modules/xlsx/')) {
            return 'xlsx-vendor';
          }
        },
      },
    },
    target: 'es2019',
    // Use terser in production for better dead-code elimination and log stripping
    minify: mode === 'production' ? 'terser' : 'esbuild',
    terserOptions: mode === 'production' ? {
      compress: {
        // Strip all console.* calls in production builds
        drop_console: true,
        drop_debugger: true,
        // Remove dead code
        dead_code: true,
        // Inline small functions
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
    // In dev mode, keep logs. In production, terser handles stripping.
    drop: [],
  },
}))