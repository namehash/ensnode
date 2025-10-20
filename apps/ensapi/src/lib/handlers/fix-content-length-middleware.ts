import { createMiddleware } from "hono/factory";

// manually unsets possibly incorrect Content-Length header so hono recalculates before returning
// TODO: remove after https://github.com/bleu/ponder-enrich-gql-docs-middleware/issues/1
export const fixContentLengthMiddleware = createMiddleware(async function (context, next) {
  await next();

  context.res.headers.delete("Content-Length");
});
