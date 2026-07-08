import { cpSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { defineConfig } from "tsup";

// Resolve the ENSDb SDK's `migrations/` folder (it ships `files: ["dist","migrations"]` at its
// package root) so we can copy it next to the bundle. The SDK's main entry resolves to its `src/`
// dir, so `migrations` sits one level up.
const sdkMigrationsDir = join(
  createRequire(import.meta.url).resolve("@ensnode/ensdb-sdk"),
  "..",
  "..",
  "migrations",
);

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  platform: "node",
  target: "es2022",
  bundle: true,
  // Bundle the workspace packages (their dev `exports` point at TS source, which plain `node` can't
  // resolve), but keep the heavy/real node_modules deps external — they're valid ESM packages and
  // resolve from node_modules at runtime (this is a private, in-repo tool, so node_modules is always
  // present).
  noExternal: [/^@ensnode\//, /^enssdk$/],
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  outDir: "./dist",
  // Copy the ENSNode Schema migrations into dist so they ride along with the standalone bundle; the
  // CLI resolves them at runtime via `fileURLToPath(new URL("./migrations", import.meta.url))`.
  onSuccess: async () => {
    cpSync(sdkMigrationsDir, join("dist", "migrations"), { recursive: true });
  },
});
