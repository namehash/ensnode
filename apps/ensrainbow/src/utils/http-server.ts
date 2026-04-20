import type { Server as HttpServer } from "node:http";
import type { Http2Server, Http2SecureServer } from "node:http2";

/**
 * Promisified wrapper around Node's callback-based `http.Server.close()`.
 *
 * `@hono/node-server`'s `serve()` returns a plain Node `http.Server | Http2Server |
 * Http2SecureServer`, whose `close(callback?)` is NOT promise-returning (it returns `this`).
 * Directly `await`ing `httpServer.close()` therefore resolves immediately against a
 * non-thenable server object, so in-flight requests would be racing any subsequent teardown
 * (DB close, etc.). This wrapper makes the await actually wait until all active connections
 * have finished, or `close` has errored.
 */
export function closeHttpServer(
  server: HttpServer | Http2Server | Http2SecureServer,
): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        // `server.close()` is idempotent from a lifecycle perspective. If shutdown races with
        // another close path and the server is already stopped, treat this as a no-op.
        if ("code" in error && error.code === "ERR_SERVER_NOT_RUNNING") {
          resolve();
          return;
        }
        reject(error);
        return;
      }
      resolve();
    });
  });
}
