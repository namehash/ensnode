import { fileURLToPath } from "node:url";

/**
 * Absolute path to the ENSNode Schema migrations directory.
 *
 * tsup copies the ENSDb SDK's `migrations/` folder next to the bundled `dist/cli.js` at build time
 * (see `tsup.config.ts`), so we resolve it relative to this module's URL. This works whether the CLI
 * runs from source (tsx) or as the standalone bundle, without depending on `node_modules` resolution.
 */
export function ensnodeMigrationsDir(): string {
  return fileURLToPath(new URL("./migrations", import.meta.url));
}
