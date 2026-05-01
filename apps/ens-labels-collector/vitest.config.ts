import { resolve } from "node:path";

import { configDefaults, defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    name: "ens-labels-collector",
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
  },
});
