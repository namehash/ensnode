import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  platform: "node",
  target: "es2022",
  bundle: true,
  // Bundle everything (incl. workspace packages) into a single self-contained bin, so `npx enscli`
  // needs no dependency resolution and dev runs don't hit the deps' TypeScript source.
  noExternal: [/.*/],
  // Inline the Omnigraph SDL as a string at build time (used by `omnigraph schema`).
  loader: { ".graphql": "text" },
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  outDir: "./dist",
});
