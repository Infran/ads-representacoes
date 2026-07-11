import { defineConfig } from 'vitest/config'

// Config dedicada aos testes de firestore.rules (SEG S3.1). Roda em Node
// (não jsdom), sem o setup do jest-dom, e conecta no Firestore Emulator
// (iniciado por `firebase emulators:exec` — ver script test:rules). Fica
// fora do `src/` para não misturar com os characterization tests (EST F1).
export default defineConfig({
  test: {
    include: ['test/rules/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
})
