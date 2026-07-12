import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Vitest: ambiente jsdom + globals (describe/it/expect) e matchers do
  // jest-dom carregados no setup. CSS desativado no teste (imports viram
  // no-op) — os characterization tests não dependem de estilo.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  // Remove console/debugger apenas no build de produção (defesa em
  // profundidade; complementa o logger por env de EST F4.5).
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
}))
