import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Performance optimization - parallel execution
    pool: 'threads',
    maxWorkers: 4,

    // Test environment
    environment: 'jsdom',
    globals: true,
    
    // Setup files
    setupFiles: [
      './tests/setup/global-setup.ts',
      './tests/setup/client-setup.ts',
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'client/src/**/*.{ts,tsx}',
        'server/**/*.ts',
        'shared/**/*.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/test/**',
        '**/tests/**',
        '**/*.config.{ts,js}',
        '**/vite.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    
    // Test filtering
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'build'],
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter
    reporters: ['verbose'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../client/src'),
      '@shared': path.resolve(__dirname, '../../shared'),
      '@tests': path.resolve(__dirname, '../../tests'),
      '@assets': path.resolve(__dirname, '../../attached_assets'),
    },
  },
});
