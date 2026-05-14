import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/components/legacy/index.ts"],
  platform: "browser",
  format: ["esm", "cjs"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: ["react", "react-dom", "@tanstack/react-query"],
  outDir: "./dist",
  esbuildOptions(options) {
    options.mainFields = ["browser", "module", "main"];
  },
});
