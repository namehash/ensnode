// import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
// import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
// import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";

import { createYoga } from "graphql-yoga";

import { context } from "@/graphql-api/context";
import { schema } from "@/graphql-api/schema";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("ensnode-graphql");

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

  // TODO: plugins
  // plugins: [
  //   maxTokensPlugin({ n: maxOperationTokens }),
  //   maxDepthPlugin({ n: maxOperationDepth, ignoreIntrospection: false }),
  //   maxAliasesPlugin({ n: maxOperationAliases, allowList: [] }),
  // ],
});
