import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*/vitest.config.ts", "packages/*/vitest.config.ts"],
    // we place LOG_LEVEL here at the root such that running vitest within a specific project continues
    // to print logs at the default log level
    env: {
      LOG_LEVEL: "silent",
    },
  },
});
