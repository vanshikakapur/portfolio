import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Single source of truth for the deploy subpath. App code reads
  // import.meta.env.BASE_URL and CSS uses relative url(), so this is the only
  // line to change when the repo name changes.
  base: '/portfolio/',
  plugins: [react()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
  },
})
