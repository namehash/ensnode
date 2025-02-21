import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    client: "src/client.ts",
    consts: "src/consts.ts",
    index: "src/index.ts",
    labelUtils: "src/label-utils.ts",
    "label-utils": "src/label-utils.ts",
  },
  platform: "browser",
  format: ["esm"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["viem", "@ensnode/utils"],
  outDir: "./dist",
  esbuildOptions(options) {
    options.mainFields = ["browser", "module", "main"];
  },
});
