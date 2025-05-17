import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  platform: "node",
  format: ["esm"],
  target: "node16",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["drizzle-orm", "ponder", "hono"],
  outDir: "./dist",
});
