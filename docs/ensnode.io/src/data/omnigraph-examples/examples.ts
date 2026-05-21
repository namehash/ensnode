import { ENSNODE_URL } from "src/lib/playground/constants";
import { OmnigraphExampleQuerySchema, type OmnigraphExampleQuery } from "src/lib/playground/types";

import { ACTIVE_OMNIGRAPH_VERSION } from "./active";
import { OMNIGRAPH_EXAMPLES_META } from "./meta";

/** A frozen, version-locked example query. Variables are pre-resolved for the docs namespace. */
interface SnapshotExample {
  id: string;
  query: string;
  variables: Record<string, unknown>;
}

// Eagerly load every version snapshot, then select the active one. Vite can't import a
// runtime-variable path directly, so glob all and key by path.
const examplesByVersion = import.meta.glob<SnapshotExample[]>("./versions/*/examples.json", {
  eager: true,
  import: "default",
});
const responsesByVersion = import.meta.glob<Record<string, Record<string, unknown>>>(
  "./versions/*/responses.json",
  { eager: true, import: "default" },
);

const activeExamples = examplesByVersion[`./versions/${ACTIVE_OMNIGRAPH_VERSION}/examples.json`];
if (!activeExamples) {
  throw new Error(`No Omnigraph example snapshot for version "${ACTIVE_OMNIGRAPH_VERSION}".`);
}
const activeResponses =
  responsesByVersion[`./versions/${ACTIVE_OMNIGRAPH_VERSION}/responses.json`] ?? {};

const snapshotById = new Map(activeExamples.map((example) => [example.id, example]));

// Render the curated prose set, gated on what the locked version's snapshot supports:
// a meta entry whose id is absent from the snapshot (e.g. a query authored for a not-yet-
// deployed schema) is simply skipped until that version is promoted.
export const graphqlApiOmnigraphExamples: OmnigraphExampleQuery[] = Object.entries(
  OMNIGRAPH_EXAMPLES_META,
).flatMap(([id, meta]) => {
  const example = snapshotById.get(id);
  if (!example) return [];
  const response = activeResponses[id];
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
