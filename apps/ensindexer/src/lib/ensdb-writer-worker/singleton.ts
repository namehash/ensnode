import { ensDbClient } from "@/lib/ensdb/singleton";
import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";
import { localPonderClient } from "@/lib/local-ponder-client";
import { logger } from "@/lib/logger";
import { publicConfigBuilder } from "@/lib/public-config-builder/singleton";

import { EnsDbWriterWorker } from "./ensdb-writer-worker";

let ensDbWriterWorker: EnsDbWriterWorker;

/**
 * Starts the EnsDbWriterWorker in a new asynchronous context.
 *
 * The worker will run indefinitely until it is stopped via {@link EnsDbWriterWorker.stop},
 * for example in response to a process termination signal or an internal error, at
 * which point it will attempt to gracefully shut down.
 *
 * @throws Error if the worker is already running when this function is called.
 */
export function startEnsDbWriterWorker() {
  if (typeof ensDbWriterWorker !== "undefined") {
    throw new Error("EnsDbWriterWorker has already been initialized");
  }

  ensDbWriterWorker = new EnsDbWriterWorker(
    ensDbClient,
    publicConfigBuilder,
    indexingStatusBuilder,
    localPonderClient,
  );

  ensDbWriterWorker
    .run()
    // Handle any uncaught errors from the worker
    .catch((error) => {
      // Abort the worker on error to trigger cleanup
      ensDbWriterWorker.stop();

      logger.error({
        msg: "EnsDbWriterWorker encountered an error",
        error,
      });

      // Re-throw the error to ensure the application shuts down with a non-zero exit code.
      process.exitCode = 1;
      throw error;
    });
}
