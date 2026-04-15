import { deserializePonderAppContext, type PonderAppContext } from "@ensnode/ponder-sdk";

/**
 * Local Ponder Context — reactive wrapper over Ponder's runtime globals.
 *
 * Why this is a Proxy and not an eagerly-deserialized object:
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
 * Stable fields (`command`, `localPonderAppUrl`, `logger`) are validated
 * once and memoized — Ponder does not mutate `options` or `logger` on
 * reload. Reload-scoped fields (`apiShutdown`, `shutdown`) MUST be re-read
 * from `globalThis.PONDER_COMMON` on every access.
 *
 * Contract for callers: NEVER cache reload-scoped fields in a module-level
 * closure or capture them in a constructor argument. Always reach for them
 * via `localPonderContext.<field>` from code that runs per-reload (e.g. the
 * API entry file or per-request handlers). If you need an `AbortSignal`
 * across calls, store a getter (`() => localPonderContext.apiShutdown
 * .abortController.signal`), not the signal itself.
 */

if (!globalThis.PONDER_COMMON) {
  throw new Error("PONDER_COMMON must be defined by Ponder at runtime as a global variable.");
}

/**
 * Ponder shutdown manager runtime shape.
 *
 * Mirrors `ponder/src/internal/shutdown.ts` — the object Ponder publishes
 * on `globalThis.PONDER_COMMON.{shutdown,apiShutdown}`.
 */
export interface PonderAppShutdownManager {
  add: (callback: () => undefined | Promise<unknown>) => void;
  isKilled: boolean;
  abortController: AbortController;
}

function isPonderAppShutdownManager(value: unknown): value is PonderAppShutdownManager {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.add === "function" &&
    typeof obj.isKilled === "boolean" &&
    obj.abortController instanceof AbortController
  );
}

function readShutdownManager(field: "apiShutdown" | "shutdown"): PonderAppShutdownManager {
  const raw = (globalThis.PONDER_COMMON as Record<string, unknown> | undefined)?.[field];
  if (!isPonderAppShutdownManager(raw)) {
    throw new Error(`globalThis.PONDER_COMMON.${field} is not a valid Ponder shutdown manager.`);
  }
  return raw;
}

let cachedStableContext: PonderAppContext | undefined;
function getStableContext(): PonderAppContext {
  if (!cachedStableContext) {
    if (!globalThis.PONDER_COMMON) {
      throw new Error("PONDER_COMMON must be defined by Ponder at runtime as a global variable.");
    }
    cachedStableContext = deserializePonderAppContext(globalThis.PONDER_COMMON);
  }
  return cachedStableContext;
}

/**
 * Local Ponder Context.
 *
 * Combines stable {@link PonderAppContext} fields with reload-scoped
 * shutdown managers. See module-level comment for the staleness contract.
 */
export interface LocalPonderContext extends PonderAppContext {
  /**
   * The current `apiShutdown` manager. RELOAD-SCOPED — identity changes
   * every API hot-reload. Always read fresh; never cache.
   */
  readonly apiShutdown: PonderAppShutdownManager;

  /**
   * The current `shutdown` manager. RELOAD-SCOPED — identity changes
   * every indexing hot-reload. Always read fresh; never cache.
   */
  readonly shutdown: PonderAppShutdownManager;
}

export const localPonderContext: LocalPonderContext = new Proxy({} as LocalPonderContext, {
  get(_target, prop) {
    if (prop === "apiShutdown") return readShutdownManager("apiShutdown");
    if (prop === "shutdown") return readShutdownManager("shutdown");
    return getStableContext()[prop as keyof PonderAppContext];
  },
});
