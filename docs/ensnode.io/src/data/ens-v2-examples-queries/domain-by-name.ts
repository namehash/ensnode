import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/omnigraph-api/example-queries";

import { ENSNODE_URL } from "../../components/playgrounds/common";
import { DOCS_OMNIGRAPH_NAMESPACE, omnigraphExampleQuerySchema } from "./common";

const DOMAIN_BY_NAME_RESPONSE = {
  data: {
    domain: {
      __typename: "ENSv2Domain",
      id: "0x…",
      label: { interpreted: "sfmonicdebmig", hash: "0x…" },
      name: "sfmonicdebmig.eth",
      owner: { address: "0x2f8e8b1126e75fde0b7f731e7cb5847eba2d2574" },
      subregistry: {
        contract: { chainId: 11155111, address: "0x…" },
      },
    },
  },
};

export const domainByNameExample = omnigraphExampleQuerySchema.parse(
  (() => {
    const example = getGraphqlApiExampleQueryById("domain-by-name");
    return {
      id: example.id,
      name: "Domain By Name",
      description:
        "Load a domain by interpreted name, including v1/v2 discriminated fields and subregistry on ENSv2.",
      category: "Resolution",
      query: example.query.trim(),
      variables: getNamespaceSpecificValue(DOCS_OMNIGRAPH_NAMESPACE, example.variables),
      response: DOMAIN_BY_NAME_RESPONSE,
      connection: ENSNODE_URL,
    };
  })(),
);
