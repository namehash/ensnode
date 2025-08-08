import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  platform: "node",
  format: ["esm"],
  target: "node16",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: [
    "@escape.tech/graphql-armor-max-aliases",
    "@escape.tech/graphql-armor-max-depth",
    "@escape.tech/graphql-armor-max-tokens",
    "dataloader",
    "drizzle-orm",
    "graphql",
    "graphql-scalars",
    "graphql-yoga",
    "hono",
  ],
  outDir: "./dist",
});
