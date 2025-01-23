import { defineConfig } from "tsup";

export default defineConfig({
  name: "@ensnode/subgraph-graphql",
  entry: ["src/middleware.ts"],
  format: ["esm"],
  sourcemap: true,
  dts: true,
  clean: true,
  splitting: true,
  skipNodeModulesBundle: true,
});
