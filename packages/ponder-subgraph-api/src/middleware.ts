/**
 * This is ponder's graphql/middleware.ts with the following changes:
 * 0. removes internal typings
 * 1. removed ponder's GraphiQL, enabled graphql-yoga's GraphiQL.
 * 2. builds our custom subgraph-compatible schema instead of ponder's
 * 3. removes schema.graphql generation
 * 4. emits stack traces to console.log
 */

import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";
import type { GraphQLSchema } from "graphql";
import { createYoga } from "graphql-yoga";
import { createMiddleware } from "hono/factory";
import { buildDataLoaderCache } from "./graphql";

export const graphql = (
  {
    db,
    graphqlSchema,
  }: {
    db: any;
    graphqlSchema: GraphQLSchema;
  },
  {
    maxOperationTokens = 1000,
    maxOperationDepth = 100,
    maxOperationAliases = 30,
  }: {
    maxOperationTokens?: number;
    maxOperationDepth?: number;
    maxOperationAliases?: number;
  } = {
    // Default limits are from Apollo:
    // https://www.apollographql.com/blog/prevent-graph-misuse-with-operation-size-and-complexity-limit
    maxOperationTokens: 1000,
    maxOperationDepth: 100,
    maxOperationAliases: 30,
  },
) => {
  const yoga = createYoga({
    graphqlEndpoint: "*", // Disable built-in route validation, use Hono routing instead
    schema: graphqlSchema,
    context: () => {
      const getDataLoader = buildDataLoaderCache({ drizzle: db });

      return { drizzle: db, getDataLoader };
    },
    maskedErrors:
      process.env.NODE_ENV === "production"
        ? true
        : {
            maskError(error: any) {
              console.error(error.originalError);
              return error;
            },
          },
    logging: false,
    graphiql: true,
    parserAndValidationCache: false,
    plugins: [
      maxTokensPlugin({ n: maxOperationTokens }),
      maxDepthPlugin({ n: maxOperationDepth, ignoreIntrospection: false }),
      maxAliasesPlugin({ n: maxOperationAliases, allowList: [] }),
    ],
  });

  return createMiddleware(async (c) => {
    const response = await yoga.handle(c.req.raw);
    // TODO: Figure out why Yoga is returning 500 status codes for GraphQL errors.
    // @ts-expect-error
    response.status = 200;
    // @ts-expect-error
    response.statusText = "OK";

    return response;
  });
};
