import {
  deserializePonderAppContext,
  isPonderAppShutdownManager,
  type PonderAppShutdownManager,
} from "@ensnode/ponder-sdk";

/**
 * Local Ponder Context — wrappers over Ponder's runtime globals.
 *
 * Stable vs reload-scoped fields:
 *
 * Ponder's dev mode hot-reloads the API entry file by re-executing it via
 * vite-node. On every indexing-file change, Ponder ALSO kills and replaces
 * `common.shutdown` and `common.apiShutdown` on `globalThis.PONDER_COMMON`
 * (see `ponder/src/bin/commands/dev.ts:95-101`). Modules in our API-side
 * dependency graph (this file included) are NOT re-evaluated when only an
 * indexing file changes — vite-node only invalidates the changed file's
 * dep tree. So any value cached in a module-level closure during the
 * original boot becomes stale on the very next reload.
 *
 * Stable fields (`command`, `localPonderAppUrl`, `logger`) are eagerly
 * deserialized once at module load — Ponder does not mutate `options` or
 * `logger` on reload. Reload-scoped fields are exposed as FUNCTIONS
 * ({@link getApiShutdown}, {@link getShutdown}) rather than properties on
 * the context object so that every call site is forced to re-read fresh
 * from `globalThis.PONDER_COMMON`. The function call form makes the
 * staleness contract visible at the call site — a captured `const sig =
 * getApiShutdown().abortController.signal` is obviously caching a
 * function result, whereas a captured `localPonderContext.apiShutdown`
 * would have looked like an innocent property access.
 *
 * Contract for callers: NEVER cache the return value of `getApiShutdown`
 * or `getShutdown` (or any field on it) in a module-level closure or a
 * constructor argument. If you need to attach a listener or read the
 * signal across calls, store the GETTER function, not its return value.
 */

if (!globalThis.PONDER_COMMON) {
  throw new Error("PONDER_COMMON must be defined by Ponder at runtime as a global variable.");
}

export const localPonderContext = deserializePonderAppContext(globalThis.PONDER_COMMON);

function readShutdownManager(field: "apiShutdown" | "shutdown"): PonderAppShutdownManager {
  const raw = (globalThis.PONDER_COMMON as Record<string, unknown> | undefined)?.[field];
  if (!isPonderAppShutdownManager(raw)) {
    throw new Error(`globalThis.PONDER_COMMON.${field} is not a valid Ponder shutdown manager.`);
  }
  return raw;
}

/**
 * Returns the current `apiShutdown` manager. RELOAD-SCOPED — Ponder
 * replaces this on every API hot reload. Always call fresh; never cache.
 */
export function getApiShutdown(): PonderAppShutdownManager {
  return readShutdownManager("apiShutdown");
}

/**
 * Returns the current `shutdown` manager. RELOAD-SCOPED — Ponder
 * replaces this on every indexing hot reload. Always call fresh; never cache.
 */
export function getShutdown(): PonderAppShutdownManager {
  return readShutdownManager("shutdown");
}
