import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Stamped into the settings screen, so "is the new build actually live?" is a
  // question you answer by looking rather than by guessing at caches.
  define: {
    __BUILD_STAMP__: JSON.stringify(
      new Date().toISOString().slice(0, 16).replace('T', ' ')
    ),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // ~30 jsdom suites that mount whole games: one worker per core starved them
    // and random tests blew the 5s default. Fewer workers, a roomier budget.
    maxWorkers: 6,
    testTimeout: 20000,
  },
})
