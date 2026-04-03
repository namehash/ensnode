import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["./**/*/vitest.integration.config.ts"],
    env: {
      // allows the syntax highlight of graphql request/responses to propagate through vitest's logs
      FORCE_COLOR: "true",
      ENSNODE_URL: process.env.ENSNODE_URL ?? "http://localhost:4334",
    },
  },
});
