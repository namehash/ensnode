import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*/vitest.integration.config.ts", "packages/*/vitest.integration.config.ts"],
  },
});
