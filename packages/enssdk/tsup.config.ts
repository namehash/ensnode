import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "omnigraph/index": "src/omnigraph/index.ts",
  },
  platform: "neutral",
  format: ["esm"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["gql.tada", "graphql"],
  outDir: "./dist",
});
