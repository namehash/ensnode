import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  platform: "node",
  target: "es2022",
  bundle: true,
  // Bundle the workspace packages (their dev `exports` point at TS source, which plain `node` can't
  // resolve), but keep the heavy/real node_modules deps external — they're valid ESM packages and
  // resolve from node_modules at runtime (this is a private, in-repo tool, so node_modules is always
  // present). The ENSDb SDK migrations dir is still resolved via createRequire against node_modules.
  noExternal: [/^@ensnode\//, /^enssdk$/],
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  outDir: "./dist",
});
