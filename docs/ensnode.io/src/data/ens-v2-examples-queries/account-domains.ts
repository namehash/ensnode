import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/omnigraph-api/example-queries";

import { ENSNODE_URL } from "../../components/playgrounds/common";
import { DOCS_OMNIGRAPH_NAMESPACE, omnigraphExampleQuerySchema } from "./common";

const ACCOUNT_DOMAINS_RESPONSE = {
  data: {
    account: {
      domains: {
        edges: [
          {
            node: {
              label: { interpreted: "sfmonicdebmig" },
              name: "sfmonicdebmig.eth",
            },
          },
        ],
      },
    },
  },
};

export const accountDomainsExample = omnigraphExampleQuerySchema.parse(
  (() => {
    const example = getGraphqlApiExampleQueryById("account-domains");
    return {
      id: example.id,
      name: "Account Domains",
      description: "List domains owned by an address via the Omnigraph account root field.",
      category: "Accounts",
      query: example.query.trim(),
      variables: getNamespaceSpecificValue(DOCS_OMNIGRAPH_NAMESPACE, example.variables),
      response: ACCOUNT_DOMAINS_RESPONSE,
      connection: ENSNODE_URL,
    };
  })(),
);
