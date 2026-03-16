import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/ensindexer/index.ts", "src/ensnode/index.ts"],
  platform: "neutral",
  format: ["esm"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["viem", "ponder", "drizzle-orm", "drizzle-orm/pg-core"],
  outDir: "./dist",
});
