import EnssdkPlayground from "../molecules/EnssdkPlayground";
import { ENSNODE_URL, getNiceHeightForSnippet } from "./common";

const snippet = `
import { createEnsNodeClient } from 'enssdk/core';
import { omnigraph, graphql } from 'enssdk/omnigraph';
import { asInterpretedName } from "enssdk";

const client = createEnsNodeClient({
  url: '${ENSNODE_URL}',
}).extend(omnigraph);

const MyQuery = graphql(\`
  query MyQuery($name: InterpretedName!) {
    domain(by: { name: $name }) { 
      name
      owner { address }
      resolver { contract { chainId address }}
      registration { expiry }
    }
  }
\`);

const result = await client.omnigraph.query({
  query: MyQuery,
  variables: { name: asInterpretedName('nick.eth') },
});
console.log('Result:', result.data);
`.trim();

export default function EnssdkResolutionApiPlayground() {
  return (
    <EnssdkPlayground
      title="ENSNode SDK — Resolution API"
      description="Query ENS name data in seconds using [`@ensnode/ensnode-sdk`](/docs/integrate/integration-options/enssdk)."
      fileContent={snippet}
      height={getNiceHeightForSnippet(snippet)}
    />
  );
}
