import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  platform: "neutral",
  format: ["esm", "cjs"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["ponder", "viem", "zod"],
  noExternal: ["parse-prometheus-text-format"],
  outDir: "./dist",
});
