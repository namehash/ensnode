import { getDocsOmnigraphNamespaceConfig } from "@lib/examples/omnigraph/constants";
import {
  OmnigraphExampleQuerySchema,
  type OmnigraphExampleQuery,
} from "@lib/examples/omnigraph/example-query";

import { OMNIGRAPH_EXAMPLES_CONFIG } from "./config";
import exampleSnapshots from "./examples.json";
import responses from "./responses.json";
import type { SnapshotExample } from "./types";

const snapshotById = new Map(
  (exampleSnapshots as SnapshotExample[]).map((example) => [example.id, example]),
);
const responsesById = responses as Record<string, Record<string, unknown>>;

// Render the curated prose set, gated on what the vendored snapshot supports: a config entry
// whose id is absent from the snapshot (e.g. a query authored for a not-yet-deployed schema)
// is simply skipped until the snapshot is refreshed.
export const graphqlApiOmnigraphExamples: OmnigraphExampleQuery[] = Object.entries(
  OMNIGRAPH_EXAMPLES_CONFIG,
).flatMap(([id, config]) => {
  const example = snapshotById.get(id);
  if (!example) return [];
  const response = responsesById[id];
  const { ensnodeUrl } = getDocsOmnigraphNamespaceConfig(config.namespace);
  return [
    OmnigraphExampleQuerySchema.parse({
      id,
      name: config.name,
      description: config.description,
      category: config.category,
      namespace: config.namespace,
      query: example.query.trim(),
      variables: example.variables,
      ...(response ? { response } : {}),
      connection: ensnodeUrl,
    }),
  ];
});

const byId = new Map(graphqlApiOmnigraphExamples.map((e) => [e.id, e]));

export function getOmnigraphExampleById(id: string): OmnigraphExampleQuery {
  const found = byId.get(id);
  if (!found) {
    throw new Error(`Unknown Omnigraph example id: ${id}`);
  }
  return found;
}
