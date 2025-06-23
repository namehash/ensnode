import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    includeSource: ['src/**/*.{js,ts}'],
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
