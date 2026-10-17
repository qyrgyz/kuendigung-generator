import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // relative base so the build works under a GitHub Pages project subpath
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      include: ['src/**'],
      exclude: ['src/**/*.test.*', 'src/test-setup.ts', 'src/main.tsx'],
      thresholds: { lines: 90, branches: 90, functions: 80 },
    },
  },
})
