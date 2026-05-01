import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "interfaces/index": "src/interfaces/index.ts",
    "types/index": "src/types/index.ts",
    "cases/index": "src/cases/index.ts",
    "seeder/index": "src/seeder/index.ts",
    "vitest/index": "src/vitest/index.ts",
    "cli/index": "src/cli/index.ts",
  },
  platform: "neutral",
  format: ["esm"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["viem"],
  outDir: "./dist",
});
