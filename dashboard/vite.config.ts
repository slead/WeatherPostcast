/// <reference types="vitest" />
import path from "path"
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/WeatherReporter/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Serve the data directory from the parent folder
  publicDir: 'public',
  server: {
    fs: {
      // Allow serving files from the parent data directory
      allow: ['..'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})
