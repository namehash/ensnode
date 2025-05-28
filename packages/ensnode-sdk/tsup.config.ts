import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    utils: "src/utils/index.ts",
  },
  platform: "browser",
  format: ["esm"],
  target: "es2022",
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
