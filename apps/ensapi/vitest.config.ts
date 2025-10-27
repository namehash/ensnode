import { resolve } from "node:path";

import { defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    env: {
      LOG_LEVEL: "fatal",
    },
  },
});
