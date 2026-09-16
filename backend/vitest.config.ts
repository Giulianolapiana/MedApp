import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    env: {
      N8N_API_KEY: 'test_n8n_api_key_32_chars_long_12345678',
    }
  },
});
