import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Polling also catches edits made through the shared workspace tools.
      usePolling: true,
      interval: 300,
    },
  },
})
