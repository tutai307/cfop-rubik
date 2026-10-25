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
  test: { environment: 'node' },
}))
