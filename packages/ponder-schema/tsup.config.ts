import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/ponder.schema.ts"],
  platform: "neutral",
  format: ["esm", "cjs"],
  target: "es2020",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["viem", "ponder"],
  outDir: "./dist",
});
