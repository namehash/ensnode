import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/omnigraph-api/example-queries";

import { DOCS_OMNIGRAPH_NAMESPACE, ENSNODE_URL } from "src/lib/playground/constants";
import { OmnigraphExampleQuerySchema, type OmnigraphExampleQuery } from "src/lib/playground/types";

import { COOKBOOK_META } from "./meta";
import cookbookResponses from "./responses.json";

const responsesById = cookbookResponses as Record<string, Record<string, unknown>>;

export const graphqlApiCookbookExamples: OmnigraphExampleQuery[] = Object.entries(
  COOKBOOK_META,
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

const byId = new Map(graphqlApiCookbookExamples.map((e) => [e.id, e]));

export function getOmnigraphExampleById(id: string): OmnigraphExampleQuery {
  const found = byId.get(id);
  if (!found) {
    throw new Error(`Unknown Omnigraph example id: ${id}`);
  }
  return found;
}
