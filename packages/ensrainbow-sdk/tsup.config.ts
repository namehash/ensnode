import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    client: "src/client.ts",
    consts: "src/consts.ts",
    types: "src/types.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["viem"],
});
