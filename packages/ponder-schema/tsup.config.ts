import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/ponder.schema.ts"],
  platform: "neutral",
  format: ["esm", "cjs"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: {
    resolve: true,
  },
  clean: true,
  external: ["viem", "ponder", "drizzle-orm", "drizzle-orm/pg-core"],
  outDir: "./dist",
});
