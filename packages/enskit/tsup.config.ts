import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "react/index": "src/react/index.ts",
    "react/omnigraph/index": "src/react/omnigraph/index.ts",
  },
  platform: "browser",
  format: ["esm"],
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "enssdk",
    "graphql",
    "gql.tada",
    "@urql/core",
    "@urql/exchange-graphcache",
    "urql",
  ],
  outDir: "./dist",
});
