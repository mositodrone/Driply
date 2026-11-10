// vitest.config.ts
//
// Separate from vite.config.ts on purpose — TanStack Start, Nitro, and the
// devtools plugins all assume a server runtime that doesn't exist in jsdom.
// Vitest gets a clean config that only loads what tests actually need.

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    // Plain React plugin — no React Compiler babel transform in tests
    // (it causes issues with mocked modules and isn't needed for correctness)
    react(),
  ],

  resolve: {
    alias: {
      // Mirror the `#/*` import alias from package.json
      '#': resolve(__dirname, './src'),
    },
  },

  test: {
    // jsdom gives us a browser-like environment for React component tests.
    // Use 'node' for pure logic tests (actions, utils, models) — faster.
    // Override per-file with: // @vitest-environment node
    environment: 'jsdom',

    // Makes vi, expect, describe, it etc available without importing them
    globals: true,

    // Run src/tests/__setup__.ts before every test file
    setupFiles: ['./src/tests/__setup__.ts'],

    // Where to find tests — co-located *.test.ts(x) OR in src/tests/
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/tests/**/*.test.ts',
      'src/tests/**/*.test.tsx',
    ],

    // Never try to test the actual route files — they import Nitro/Vinxi
    // server internals that don't exist in jsdom
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/routes/api/**',          // server route handlers
      'src/routes/**/__root*',      // TanStack root route
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/routes/',               // routes are integration-tested separately
        '**/*.d.ts',
        '**/index.ts',
      ],
    },
  },
})
