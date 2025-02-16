import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    middleware: "src/middleware.ts",
    graphql: "src/graphql.ts",
    helpers: "src/helpers.ts",
  },
  platform: "node",
  format: ["esm", "cjs"],
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
