// import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
// import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
// import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";

import config from "@/config";

import { getUnixTime } from "date-fns";
import { createYoga } from "graphql-yoga";

import { schema } from "@/graphql-api/schema";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { requireCorePluginMiddleware } from "@/middleware/require-core-plugin.middleware";

const logger = makeLogger("ensnode-graphql");

const yoga = createYoga({
  graphqlEndpoint: "*",
  schema,
  context: () => ({
    // inject config's namespace into context, feel cleaner than accessing from @/config directly
    namespace: config.namespace,

    // generate a bigint UnixTimestamp per-request for handlers to use
    now: BigInt(getUnixTime(new Date())),
  }),
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

  // TODO: plugins
  // plugins: [
  //   maxTokensPlugin({ n: maxOperationTokens }),
  //   maxDepthPlugin({ n: maxOperationDepth, ignoreIntrospection: false }),
  //   maxAliasesPlugin({ n: maxOperationAliases, allowList: [] }),
  // ],
});

const app = factory.createApp();

app.use(requireCorePluginMiddleware("ensv2"));
app.use(async (c) => {
  const response = await yoga.fetch(c.req.raw, c.var);
  return response;
});

export default app;
