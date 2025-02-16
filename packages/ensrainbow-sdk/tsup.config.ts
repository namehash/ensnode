import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    client: "src/client.ts",
    consts: "src/consts.ts",
    index: "src/index.ts",
    labelUtils: "src/label-utils.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["viem"],
});
