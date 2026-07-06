import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // На GitHub Pages сайт живе за /flight-diary/, локально — за /
  base: command === 'build' ? '/flight-diary/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3210',
    },
  },
}))
