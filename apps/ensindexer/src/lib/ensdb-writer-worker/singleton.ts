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
      // If Ponder has begun shutting down our API instance (hot reload or
      // graceful shutdown), the abort propagates through in-flight fetches
      // (or `signal.throwIfAborted()`) as an AbortError. Treat that as a
      // clean stop, not a worker failure.
      if (abortSignal.aborted || isAbortError(error)) {
        await gracefulShutdown(worker, "API shutdown (run aborted)");
        return;
      }

      // Real worker error — clean up and trigger non-zero exit.
      await gracefulShutdown(worker, "uncaught error");

      logger.error({
        msg: "EnsDbWriterWorker encountered an error",
        error,
      });

      // Re-throw the error to ensure the application shuts down with a non-zero exit code.
      process.exitCode = 1;
      throw error;
    });
}
