import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineProject } from "vitest/config";

const cwd = dirname(fileURLToPath(import.meta.url));

export default defineProject({
  resolve: {
    alias: {
      "@": resolve(cwd, "./src"),
    },
  },
});
