// import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
// import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
// import { maxTokensPlugin } from "@escape.tech/graphql-armor-max-tokens";

import { createYoga } from "graphql-yoga";

import { schema } from "@/graphql-api/schema";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";

const logger = makeLogger("ensnode-graphql");

const yoga = createYoga({
  graphqlEndpoint: "*",
  schema,
  graphiql: {
    defaultQuery: `query GetCanonicalNametree {
  root {
    domain { label }
    domains {
      label
      subregistry {
        domains {
          label
          subregistry {
            domains {
              label
            }
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

app.use(async (c) => {
  const response = await yoga.fetch(c.req.raw, c.var);
  return response;
});

export default app;
