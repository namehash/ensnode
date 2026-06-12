// import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
// import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
// import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";

import { GraphQLError } from "graphql";
import { createYoga, maskError } from "graphql-yoga";
import { ZodError } from "zod/v4";

import { makeLogger } from "@/lib/logger";
import {
  type Context,
  createOmnigraphContext,
  type OmnigraphYogaServerContext,
} from "@/omnigraph-api/context";
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

export const yoga = createYoga<OmnigraphYogaServerContext, Context>({
  graphqlEndpoint: "*",
  schema,
  context: createOmnigraphContext,
  // CORS is handled by the Hono middleware in app.ts
  cors: false,
  // Error masking:
  // - Production: use Yoga defaults so internal details are not exposed to clients.
  // - Non-production: still apply the same masked client payload, but log the **original**
  //   error server-side first. This makes debugging much easier than only seeing the masked
  //   message, while keeping the client-facing behavior aligned with production.
  //
  // Motivation: some resolvers intentionally throw `GraphQLError` (e.g. validation for
  // `Query.labels`), but other code paths may throw plain `Error`. Yoga's default `maskError`
  // maps unknown errors to a generic "Unexpected error." on the client; logging here ensures
  // the real stack/message is still visible in local/staging logs.
  maskedErrors:
    process.env.NODE_ENV === "production"
      ? true
      : {
          maskError(error, message, isDev) {
            logger.error(error);
            return maskError(error, message, isDev);
          },
        },
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
