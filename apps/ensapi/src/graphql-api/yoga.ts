// import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
// import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
// import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";

import config from "@/config";

import { getUnixTime } from "date-fns";
import { createYoga } from "graphql-yoga";

import { schema } from "@/graphql-api/schema";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("ensnode-graphql");

export const yoga = createYoga({
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
