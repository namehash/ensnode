import { ponder } from "ponder:registry";
import { default as schema } from "ponder:schema";

import { createMiddleware } from "hono/factory";
import { buildGraphQLSchema } from "./graphql";
import { graphql } from "./middleware";

// inject our custom schema into the hono context, to be used in middleware.ts
const overrideGraphqlSchemaMiddleware = createMiddleware(async (c, next) => {
  c.set("graphqlSchema", buildGraphQLSchema(schema));
  return await next();
});

ponder.use(overrideGraphqlSchemaMiddleware);
ponder.use("/", graphql());
