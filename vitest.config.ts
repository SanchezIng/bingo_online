import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // El módulo virtual de vite-plugin-pwa no existe en tests; lo aliasamos
      // a un stub que devuelve estado neutral. Tests que necesiten otro
      // comportamiento mockean el módulo explícitamente.
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./src/test-utils/pwa-register-stub.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/types.ts'],
    },
  },
})
