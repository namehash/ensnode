import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/omnigraph-api/example-queries";

import { DOCS_OMNIGRAPH_NAMESPACE, ENSNODE_URL } from "src/lib/playground/constants";
import { OmnigraphExampleQuerySchema, type OmnigraphExampleQuery } from "src/lib/playground/types";

import { OMNIGRAPH_EXAMPLES_META } from "./meta";
import omnigraphExampleResponses from "./responses.json";

const responsesById = omnigraphExampleResponses as Record<string, Record<string, unknown>>;

export const graphqlApiOmnigraphExamples: OmnigraphExampleQuery[] = Object.entries(
  OMNIGRAPH_EXAMPLES_META,
).map(([id, meta]) => {
  const example = getGraphqlApiExampleQueryById(id);
  const response = responsesById[id];
  return OmnigraphExampleQuerySchema.parse({
    id: example.id,
    name: meta.name,
    description: meta.description,
    category: meta.category,
    query: example.query.trim(),
    variables: getNamespaceSpecificValue(DOCS_OMNIGRAPH_NAMESPACE, example.variables),
    ...(response ? { response } : {}),
    connection: ENSNODE_URL,
  });
});

const byId = new Map(graphqlApiOmnigraphExamples.map((e) => [e.id, e]));

export function getOmnigraphExampleById(id: string): OmnigraphExampleQuery {
  const found = byId.get(id);
  if (!found) {
    throw new Error(`Unknown Omnigraph example id: ${id}`);
  }
  return found;
}
