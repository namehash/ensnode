import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { configDefaults, defineProject } from "vitest/config";

const cwd = dirname(fileURLToPath(import.meta.url));

export default defineProject({
  resolve: {
    alias: {
      "@": resolve(cwd, "./src"),
    },
  },
  test: {
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});
