import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const docsRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@assets": resolve(docsRoot, "src/assets"),
      "@components": resolve(docsRoot, "src/components"),
      "@content": resolve(docsRoot, "src/content"),
      "@data": resolve(docsRoot, "src/data"),
      "@lib": resolve(docsRoot, "src/lib"),
      "@scripts": resolve(docsRoot, "src/scripts"),
      "@styles": resolve(docsRoot, "src/styles"),
      "@workspace": resolve(docsRoot, "../.."),
    },
  },
  test: {
    name: "@docs/ensnode",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
