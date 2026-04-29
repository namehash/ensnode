import { getConfig } from "@/config";

import { serve } from "@hono/node-server";

import app from "@/app";

const config = getConfig();

const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`ens-labels-collector listening on port ${info.port}`);
  },
);

/**
 * Promisified `server.close()` that treats `ERR_SERVER_NOT_RUNNING` as a no-op so concurrent
 * shutdown paths (e.g. SIGINT immediately followed by SIGTERM) don't reject the second close.
 */
const closeServer = () =>
  new Promise<void>((resolve, reject) =>
    server.close((err) => {
      if (!err) {
        resolve();
        return;
      }
      if (typeof err === "object" && "code" in err && err.code === "ERR_SERVER_NOT_RUNNING") {
        resolve();
        return;
      }
      reject(err);
    }),
  );

let shutdownPromise: Promise<void> | undefined;

/**
 * Closes the HTTP server and exits with `exitCode` (default 0).
 *
 * Guarded with a single in-flight promise so repeated SIGINT/SIGTERM (or `uncaughtException`
 * arriving during an in-progress shutdown) never trigger a duplicate close.
 */
const gracefulShutdown = (exitCode: number = 0): Promise<void> => {
  if (!shutdownPromise) {
    shutdownPromise = closeServer()
      .catch((error) => {
        console.error("[ens-labels-collector] shutdown error", error);
        exitCode = exitCode === 0 ? 1 : exitCode;
      })
      .then(() => {
        process.exit(exitCode);
      });
  }
  return shutdownPromise;
};

process.on("SIGINT", () => {
  void gracefulShutdown(0);
});
process.on("SIGTERM", () => {
  void gracefulShutdown(0);
});

process.on("uncaughtException", (error) => {
  console.error("[ens-labels-collector] uncaughtException", error);
  void gracefulShutdown(1);
});
