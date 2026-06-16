import { getDocsOmnigraphNamespaceConfig } from "@lib/examples/omnigraph/constants";
import {
  OmnigraphExampleQuerySchema,
  type OmnigraphExampleQuery,
} from "@lib/examples/omnigraph/example-query";

import { getOmnigraphExamplePageHref, OMNIGRAPH_EXAMPLES_CONFIG } from "./config";
import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/internal";
import exampleSnapshots from "./examples.json";
import responses from "./responses.json";
import type { SnapshotExample } from "./types";

const snapshotById = new Map(
  (exampleSnapshots as SnapshotExample[]).map((example) => [example.id, example]),
);
const responsesById = responses as Record<string, Record<string, unknown>>;

// Render the curated set in config order, gated on vendored snapshot + responses.
export const omnigraphExamples: OmnigraphExampleQuery[] = OMNIGRAPH_EXAMPLES_CONFIG.map(
  (config) => {
    const example = snapshotById.get(config.id);
    if (!example) {
      throw new Error(
        `Omnigraph example with id='${config.id}' not found in snapshot. Make sure to run 'pnpm omnigraph:snapshot <version>' first.`,
      );
    }
    const response = responsesById[config.id];
    if (!response) {
      throw new Error(
        `Omnigraph example with id='${config.id}' not found in responses. Make sure to run 'pnpm omnigraph-examples:refresh-responses' first.`,
      );
    }
    const { ensnodeUrl } = getDocsOmnigraphNamespaceConfig(config.namespace);
    const href = getOmnigraphExamplePageHref(config);
    return OmnigraphExampleQuerySchema.parse({
      id: config.id,
      title: getGraphqlApiExampleQueryById(config.id).title,
      description: getGraphqlApiExampleQueryById(config.id).description,
      category: config.category,
      namespace: config.namespace,
      query: example.query.trim(),
      variables: example.variables,
      response,
      connection: ensnodeUrl,
      href,
    });
  },
);

export const visibleOmnigraphExamples: OmnigraphExampleQuery[] = omnigraphExamples.filter(
  (example) => example.href,
);

const byId = new Map(omnigraphExamples.map((e) => [e.id, e]));

export function getOmnigraphExampleById(id: string): OmnigraphExampleQuery {
  const found = byId.get(id);
  if (!found) {
    throw new Error(`Unknown Omnigraph example id: ${id}`);
  }
  return found;
}
