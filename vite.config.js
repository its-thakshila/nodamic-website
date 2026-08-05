import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensures assets load correctly on GitHub Pages sub-path
  base: '/nodamic-website/',
})
