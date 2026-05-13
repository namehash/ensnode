import { ENSNODE_URL } from "./common";

/** Shared enssdk + Omnigraph example used on Quickstart (static) and in the Cookbook live playground. */
export const quickstartResolveDomainSnippet = `
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
