import { ensDbClient } from "@/lib/ensdb/singleton";
import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";
import { localPonderClient } from "@/lib/local-ponder-client";
import { localPonderContext } from "@/lib/local-ponder-context";
import { logger } from "@/lib/logger";
import { publicConfigBuilder } from "@/lib/public-config-builder/singleton";

import { EnsDbWriterWorker } from "./ensdb-writer-worker";

let ensDbWriterWorker: EnsDbWriterWorker | undefined;

function isAbortError(error: unknown): boolean {
  // `fetch` aborts reject with a `DOMException` whose `name === "AbortError"`,
  // which is not always `instanceof Error` across runtimes. Check by name.
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

/**
 * Stop the given worker (if it is still the active singleton) and clear the
 * singleton reference. Safe to call multiple times.
 */
async function gracefulShutdown(worker: EnsDbWriterWorker, reason: string): Promise<void> {
  logger.info({
    msg: `Stopping EnsDbWriterWorker: ${reason}`,
    module: "EnsDbWriterWorker",
  });
  await worker.stop();
  if (ensDbWriterWorker === worker) {
    ensDbWriterWorker = undefined;
  }
}

/**
 * Start (or restart) the EnsDbWriterWorker.
 *
 * Called from `apps/ensindexer/ponder/src/api/index.ts` on every Ponder
 * API exec. Ponder re-executes the API entry file on hot reload, but this
 * module is cached by vite-node, so module-level state survives across
 * reloads. This function therefore must:
 *
 *   1. Be idempotent — treat a re-call as "the previous instance is dead,
 *      replace it" rather than throwing.
 *   2. Re-bind reload-scoped resources (e.g. `apiShutdown`) fresh from
 *      `localPonderContext` on every call. Never hoist them to module
 *      scope. See `local-ponder-context.ts` for the staleness contract.
 */
export async function startEnsDbWriterWorker(): Promise<void> {
  // Defensively reset any prior instance. The apiShutdown.add() callback
  // from the previous API exec is the primary cleanup path on hot reload;
  // this is a safety net for cases where the callback didn't run (e.g.
  // unexpected shutdown ordering).
  if (ensDbWriterWorker) {
    await gracefulShutdown(ensDbWriterWorker, "stale instance from previous API exec");
  }

  const worker = new EnsDbWriterWorker(
    ensDbClient,
    publicConfigBuilder,
    indexingStatusBuilder,
    localPonderClient,
  );
  ensDbWriterWorker = worker;

  // Read apiShutdown FRESH from the reactive context. Ponder kills and
  // replaces this on every dev-mode hot reload, so this read MUST happen
  // inside the function call (not at module scope).
  const apiShutdown = localPonderContext.apiShutdown;
  const abortSignal = apiShutdown.abortController.signal;

  apiShutdown.add(() => gracefulShutdown(worker, "API shutdown"));

  worker
    .run(abortSignal)
    // Handle any uncaught errors from the worker
    .catch(async (error) => {
      // Treat as a clean stop only when BOTH the captured shutdown signal
      // is aborted AND the error is an AbortError. Either condition alone
      // could mask a real failure: a non-AbortError thrown after Ponder
      // killed the signal is still a bug worth surfacing, and an
      // AbortError without our signal aborted means it came from
      // somewhere else (e.g. a reactive-getter race) and shouldn't be
      // silently swallowed.
      if (abortSignal.aborted && isAbortError(error)) {
        await gracefulShutdown(worker, "API shutdown (run aborted)");
        return;
      }

      // Real worker error — clean up and fail-fast. The worker is a startup
      // invariant for the API layer; leaving the process half-alive (just
      // setting `process.exitCode`) would let ensindexer keep serving with a
      // dead writer. We can't rethrow because this `.catch()` is on a
      // fire-and-forget promise, so a rethrow becomes an unhandled rejection
      // instead of reaching a top-level handler — call `process.exit(1)` to
      // terminate immediately.
      await gracefulShutdown(worker, "uncaught error");

      logger.error({
        msg: "EnsDbWriterWorker encountered an error",
        error,
      });

      process.exit(1);
    });
}
