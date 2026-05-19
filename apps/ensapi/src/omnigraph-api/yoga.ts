// import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
// import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
// import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";

import { GraphQLError } from "graphql";
import { createYoga } from "graphql-yoga";
import { ZodError } from "zod/v4";

import { makeLogger } from "@/lib/logger";
import { context } from "@/omnigraph-api/context";
import { schema } from "@/omnigraph-api/schema";

const logger = makeLogger("omnigraph");

// tests exact ZodError or GraphQLError-wrapped ZodError
const isZodError = (value: unknown): boolean =>
  value instanceof ZodError ||
  (value instanceof GraphQLError && value.originalError instanceof ZodError);

// Yoga logs every execution error (including GraphQL input validation errors) at `error` level, but
// those validation errors are expected, in general, so we downgrade them to `debug` so server logs
// aren't flooded with stack traces.
const yogaLogger = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: (err: unknown, ..._rest: unknown[]) => {
    if (isZodError(err)) {
      logger.debug({ err }, "GraphQL input validation rejected");
      return;
    }
    logger.error({ err }, "GraphQL execution error");
  },
};

export const yoga = createYoga({
  graphqlEndpoint: "*",
  schema,
  context,
  // CORS is handled by the Hono middleware in app.ts
  cors: false,
  graphiql: {
    defaultQuery: `query DomainsByOwner {
  account(by: { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" }) {
    domains {
      edges {
        node {
          id
          label
          owner { address }
          registration { expiry }
          parent { label }
          registry { contract { chainId address } }
        }
      }
    }
  }
}`,
  },

  // integrate logging with pino
  logging: yogaLogger,

  plugins: [
    // TODO: plugins
    // maxTokensPlugin({ n: maxOperationTokens }),
    // maxDepthPlugin({ n: maxOperationDepth, ignoreIntrospection: false }),
    // maxAliasesPlugin({ n: maxOperationAliases, allowList: [] }),
  ],
});
