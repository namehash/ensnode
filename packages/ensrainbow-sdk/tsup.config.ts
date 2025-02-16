import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    client: "src/client.ts",
    consts: "src/consts.ts",
    "label-utils": "src/label-utils.ts",
    types: "src/types.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["viem"],
  treeshake: true,
  env: {
    NODE_ENV: "production",
  },
});
