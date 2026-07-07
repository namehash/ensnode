import { fileURLToPath } from "node:url";

/**
 * Absolute path to the ENSNode Schema migrations directory.
 *
 * tsup copies the ENSDb SDK's `migrations/` folder next to the bundled `dist/cli.js` at build time
 * (see `tsup.config.ts`), so we resolve it relative to this module's URL — i.e. `dist/migrations`. The
 * CLI is always run as the built bundle (`node dist/cli.js`), so this needs no `node_modules`
 * resolution; it is NOT meant to run from `src` via tsx (where `dist/migrations` wouldn't be beside it).
 */
export function ensnodeMigrationsDir(): string {
  return fileURLToPath(new URL("./migrations", import.meta.url));
}
