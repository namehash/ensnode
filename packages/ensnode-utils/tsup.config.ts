import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "subname-helpers": "src/subname-helpers.ts",
    types: "src/types.ts",
  },
  platform: "browser",
  format: ["esm", "cjs"],
  target: "es2020",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["viem"],
  outDir: "./dist",
  esbuildOptions(options) {
    options.mainFields = ["browser", "module", "main"];
  },
});
