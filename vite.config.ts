import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the build under https://<user>.github.io/cfop-rubik/.
  base: command === 'build' ? '/cfop-rubik/' : '/',
  plugins: [react()],
  // cubing.js spawns its own module workers via `new URL(..., import.meta.url)`.
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['cubing'] },
  // cubing.js's scramble worker runs chunks that go through Vite's preload helper, and the worker
  // has no `document`. Keep the helper out of the app entry chunk (or the worker imports React)
  // and skip JS preloading (the helper's only `document` use for those chunks).
  build: {
    modulePreload: false,
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: 'preload-helper', test: /preload-helper/ }] },
      },
    },
  },
  test: { environment: 'node' },
}))
