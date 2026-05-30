import { ENSNODE_URL } from "@lib/examples/omnigraph/constants";
import {
  OmnigraphExampleQuerySchema,
  type OmnigraphExampleQuery,
} from "@lib/examples/omnigraph/example-query";

import exampleSnapshots from "./examples.json";
import { OMNIGRAPH_EXAMPLES_META } from "./meta";
import responses from "./responses.json";
import type { SnapshotExample } from "./types";

const snapshotById = new Map(
  (exampleSnapshots as SnapshotExample[]).map((example) => [example.id, example]),
);
const responsesById = responses as Record<string, Record<string, unknown>>;

// Render the curated prose set, gated on what the vendored snapshot supports: a meta entry
// whose id is absent from the snapshot (e.g. a query authored for a not-yet-deployed schema)
// is simply skipped until the snapshot is refreshed.
export const graphqlApiOmnigraphExamples: OmnigraphExampleQuery[] = Object.entries(
  OMNIGRAPH_EXAMPLES_META,
).flatMap(([id, meta]) => {
  const example = snapshotById.get(id);
  if (!example) return [];
  const response = responsesById[id];
  return [
    OmnigraphExampleQuerySchema.parse({
      id,
      name: meta.name,
      description: meta.description,
      category: meta.category,
      query: example.query.trim(),
      variables: example.variables,
      ...(response ? { response } : {}),
      connection: ENSNODE_URL,
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
