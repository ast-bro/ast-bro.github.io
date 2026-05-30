import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function resolveBase() {
  const explicitBase = process.env.VITE_BASE_PATH

  if (explicitBase) {
    return explicitBase
  }

  return '/'
}

export default defineConfig({
  base: resolveBase(),
  plugins: [react()],
})
