import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/**/*.test.ts", "src/**/*.spec.ts", "dist/", "coverage/"],
    },
    setupFiles: [],
    testTimeout: 10000,
  },
});
