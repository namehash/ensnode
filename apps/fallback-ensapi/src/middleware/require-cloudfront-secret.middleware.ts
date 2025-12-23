import { createMiddleware } from "hono/factory";

import { errorResponse } from "@/lib/error-response";

const CLOUDFLARE_SECRET = process.env.CLOUDFLARE_SECRET;

// Invariant: Require CLOUDFLARE_SECRET in production
if (process.env.NODE_ENV === "production" && !CLOUDFLARE_SECRET) {
  throw new Error(
    "fallback-ensapi requires CLOUDFLARE_SECRET in production, but it was not provided.",
  );
}

/**
 * Middleware that requires the incoming request's x-origin-secret header to exactly match the
 * provided CLOUDFLARE_SECRET in the environment.
 */
export const requireCloudflareSecret = createMiddleware(async (c, next) => {
  // if there's no secret at this point, no-op this middleware
  if (!CLOUDFLARE_SECRET) return await next();

  // require the incoming x-origin-secret header to match the configured secret, or 400
  const value = c.req.header("x-origin-secret");

  // block unauthorized invocations
  if (!value || value !== CLOUDFLARE_SECRET) {
    return errorResponse(c, { error: "Unauthorized", status: 401 });
  }

  // otherwise, proceed
  return await next();
});
