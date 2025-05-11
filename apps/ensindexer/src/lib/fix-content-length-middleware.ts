import { Context, Next } from "hono";

// manually unsets possibly incorrect Content-Length header so hono recalculates before returning
// TODO: remove after https://github.com/bleu/ponder-enrich-gql-docs-middleware/issues/1
export const fixContentLengthMiddleware = async function (context: Context, next: Next) {
  await next();

  context.res.headers.delete("Content-Length");
};
