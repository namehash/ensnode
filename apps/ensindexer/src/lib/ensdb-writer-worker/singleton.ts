import { ensDbClient } from "@/lib/ensdb-client/singleton";
import { ensIndexerClient } from "@/lib/ensindexer-client/singleton";
import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";

import { EnsDbWriterWorker } from "./ensdb-writer-worker";

let ensDbWriterWorker: EnsDbWriterWorker;

/**
 * Starts the EnsDbWriterWorker in a new asynchronous context.
 *
 * The worker will run indefinitely until it is stopped via {@link EnsDbWriterWorker.stop},
 * for example in response to a process termination signal or an internal error, at
 * which point it will attempt to gracefully shut down.
 *
 * @throws Error if the worker run method throws an error during execution.
 */
export function startEnsDbWriterWorker() {
  ensDbWriterWorker = new EnsDbWriterWorker(ensDbClient, ensIndexerClient, indexingStatusBuilder);

  ensDbWriterWorker
    .run()
    .then(() => {
      // Once the worker has successfully kicked off,
      // we can listen for termination signals to trigger a graceful shutdown
      process.on("SIGINT", () => ensDbWriterWorker.stop());
      process.on("SIGTERM", () => ensDbWriterWorker.stop());
    })
    // Handle any uncaught errors from the worker
    .catch((error) => {
      // Abort the worker on error to trigger cleanup
      ensDbWriterWorker.stop();

      console.error("EnsDbWriterWorker encountered an error:", error);

      // Re-throw the error to ensure the application shuts down with a non-zero exit code.
      process.exitCode = 1;
      throw error;
    });
}
