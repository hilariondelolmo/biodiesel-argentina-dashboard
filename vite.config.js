import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // rutas relativas para poder servir desde cualquier subdirectorio
  build: {
    outDir: 'dist',
    assetsInlineLimit: 8192, // inline fonts pequeños
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
});
