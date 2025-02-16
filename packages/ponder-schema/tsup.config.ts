import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/ponder.schema.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  platform: "node",
});
