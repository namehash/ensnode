/**
 * This is ponder's graphql/middleware.ts, copied to fix module realm errors.
 * The following changes were made:
 * 1. removed ponder's GraphiQL, enabled graphql-yoga's GraphiQL.
 * 2. builds our custom schema instead of the one provided in hono context
 * https://github.com/ponder-sh/ponder/blob/0a5645ca8dec327b0c21da432ee00810edeb087c/packages/core/src/graphql/middleware.ts
 */

import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";
import { type YogaServerInstance, createYoga } from "graphql-yoga";
import { createMiddleware } from "hono/factory";
import {
  PolymorphicConfig,
  type Schema,
  buildDataLoaderCache,
  buildGraphQLSchema,
} from "./graphql";

/**
 * Middleware for GraphQL with an interactive web view.
 *
 * - Docs: https://ponder.sh/docs/query/api-functions#register-graphql-middleware
 *
 * @example
 * import { ponder } from "ponder:registry";
 * import { graphql } from "ponder";
 *
 * ponder.use("/graphql", graphql());
 *
 */
export const graphql = ({
  schema,
  polymorphicConfig,
  // Default limits are from Apollo:
  // https://www.apollographql.com/blog/prevent-graph-misuse-with-operation-size-and-complexity-limit
  maxOperationTokens = 1000,
  maxOperationDepth = 100,
  maxOperationAliases = 30,
}: {
  schema: Schema;
  polymorphicConfig?: PolymorphicConfig;
  maxOperationTokens?: number;
  maxOperationDepth?: number;
  maxOperationAliases?: number;
}) => {
  let yoga: YogaServerInstance<any, any> | undefined = undefined;

  return createMiddleware(async (c) => {
    if (yoga === undefined) {
      const metadataStore = c.get("metadataStore");
      const graphqlSchema = buildGraphQLSchema(schema, polymorphicConfig);
      const drizzle = c.get("db");

      yoga = createYoga({
        schema: graphqlSchema,
        context: () => {
          const getDataLoader = buildDataLoaderCache({ drizzle });
          return { drizzle, metadataStore, getDataLoader };
        },
        graphqlEndpoint: c.req.path,
        maskedErrors: process.env.NODE_ENV === "production",
        logging: false,
        graphiql: true, // NOTE: enable graph-yoga's default graphiql
        parserAndValidationCache: false,
        plugins: [
          maxTokensPlugin({ n: maxOperationTokens }),
          maxDepthPlugin({ n: maxOperationDepth, ignoreIntrospection: false }),
          maxAliasesPlugin({ n: maxOperationAliases, allowList: [] }),
        ],
      });
    }

    const response = await yoga.handle(c.req.raw);
    // TODO: Figure out why Yoga is returning 500 status codes for GraphQL errors.
    // @ts-expect-error
    response.status = 200;
    // @ts-expect-error
    response.statusText = "OK";

    return response;
  });
};
