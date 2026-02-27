import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*/vitest.integration.config.ts", "packages/*/vitest.integration.config.ts"],
    env: {
      // allows the syntax highlight of graphql request/responses to propagate through vitest's logs
      FORCE_COLOR: "true",
    },
  },
});
