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
  build: {
    rollupOptions: {
      output: {
        // Separa os vendors pesados em chunks próprios para tirá-los do
        // caminho crítico (Login não carrega PDF/DataGrid; cada um cacheia
        // independente). As rotas autenticadas são lazy (ver Router.tsx),
        // então vendor-pdf/vendor-mui-x só chegam sob demanda.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@react-pdf')) return 'vendor-pdf'
          if (
            id.includes('@firebase') ||
            id.includes('/firebase/') ||
            id.includes('@grpc') ||
            id.includes('protobufjs') ||
            id.includes('/idb/')
          )
            return 'vendor-firebase'
          if (
            id.includes('@mui/x-data-grid') ||
            id.includes('@mui/x-date-pickers')
          )
            return 'vendor-mui-x'
          if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui'
          if (
            id.includes('react-router') ||
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/')
          )
            return 'vendor-react'
        },
      },
    },
  },
  // Remove console/debugger apenas no build de produção (defesa em
  // profundidade; complementa o logger por env de EST F4.5).
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
}))
