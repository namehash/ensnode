import { createMiddleware } from "hono/factory";

/**
 * Middleware that fixes Content-Length header issues with GraphQL responses.
 *
 * Manually unsets the Content-Length header so Hono can recalculate it correctly
 * before returning the response. This is a temporary workaround for GraphQL
 * middleware that may set incorrect Content-Length values.
 *
 * @todo Remove after https://github.com/bleu/ponder-enrich-gql-docs-middleware/issues/1 is resolved
 */
export const fixContentLengthMiddleware = createMiddleware(async function (context, next) {
  await next();

  context.res.headers.delete("Content-Length");
});
