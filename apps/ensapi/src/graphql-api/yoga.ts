// import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
// import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
// import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";

import { AttributeNames, SpanNames } from "@pothos/tracing-opentelemetry";
import { print } from "graphql";
import { createYoga, type Plugin } from "graphql-yoga";

import { context } from "@/graphql-api/context";
import { schema } from "@/graphql-api/schema";
import { graphqlTracer } from "@/lib/instrumentation/tracer";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("ensnode-graphql");

const graphqlTracingEnabled =
  process.env.ENSAPI_GRAPHQL_TRACING === "1" || process.env.ENSAPI_GRAPHQL_TRACING === "true";

const graphqlTracingIncludeSource =
  process.env.ENSAPI_GRAPHQL_TRACING_SOURCE === "1" ||
  process.env.ENSAPI_GRAPHQL_TRACING_SOURCE === "true";

const executionTracingPlugin: Plugin = {
  onExecute: ({ setExecuteFn, executeFn }) => {
    setExecuteFn((options) =>
      graphqlTracer.startActiveSpan(
        SpanNames.EXECUTE,
        {
          attributes: {
            [AttributeNames.OPERATION_NAME]: options.operationName ?? undefined,
            ...(graphqlTracingIncludeSource
              ? { [AttributeNames.SOURCE]: print(options.document) }
              : {}),
          },
        },
        async (span) => {
          try {
            return await executeFn(options);
          } catch (error) {
            span.recordException(error as Error);
            throw error;
          } finally {
            span.end();
          }
        },
      ),
    );
  },
};

export const yoga = createYoga({
  graphqlEndpoint: "*",
  schema,
  context,
  graphiql: {
    defaultQuery: `query DomainsByOwner {
  account(address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266") {
    domains {
      edges {
        node {
          id
          label
          owner { address }
          registration { expiry }
          ... on ENSv1Domain {
            parent { label }
          }
          ... on ENSv2Domain {
            canonicalId
            registry { contract {chainId address}}
          }
        }
      }
    }
  }
}`,
  },

  // integrate logging with pino
  logging: logger,

  plugins: [
    ...(graphqlTracingEnabled ? [executionTracingPlugin] : []),
    // TODO: plugins
    // maxTokensPlugin({ n: maxOperationTokens }),
    // maxDepthPlugin({ n: maxOperationDepth, ignoreIntrospection: false }),
    // maxAliasesPlugin({ n: maxOperationAliases, allowList: [] }),
  ],
});
