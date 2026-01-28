import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/v1/index.ts"],
  platform: "neutral",
  format: ["esm", "cjs"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["viem"],
  noExternal: ["@ensnode/ensnode-sdk"],
  outDir: "./dist",
});
