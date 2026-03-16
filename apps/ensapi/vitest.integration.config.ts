import { resolve } from "node:path";

import { defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.integration.test.ts"],
    globalSetup: "./src/test/integration/global-setup.ts",
  },
});
