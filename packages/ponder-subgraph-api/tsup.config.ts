import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    middleware: "src/middleware.ts",
    graphql: "src/graphql.ts",
    helpers: "src/helpers.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
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
});
