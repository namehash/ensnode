import { factory } from "@/lib/hono-factory";

/**
 * Middleware that asserts that the ENSApi instance is ready to serve API requests.
 * If the service is not ready yet, this middleware will short-circuit the request and
 * return a 503 Service Unavailable response.
 */
export const assertApiReadinessMiddleware = factory.createMiddleware(async (c, next) => {
  if (c.var.serviceStatus === undefined) {
    throw new Error(
      `Invariant(assert-api-readiness.middleware): serviceStatus middleware required`,
    );
  }

  if (c.var.serviceStatus.isReady) {
    await next();
  } else {
    return c.json(
      {
        error: "Service Unavailable",
        message: "ENSApi is not ready to serve API requests yet.",
      },
      503,
    );
  }
});
