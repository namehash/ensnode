import {
  buildEnskitSnippet,
  buildEnssdkSnippet,
} from "@lib/omnigraph-examples/build-integration-snippets";
import { getOmnigraphExampleById } from "@data/omnigraph-examples/examples";

import { buildStaticExampleStackBlitzProject } from "./buildStaticExampleStackBlitzProject";
import type { PlaygroundProject } from "./example-project/types";

export type StaticExampleStackBlitzIntegration = "enssdk" | "enskit";

/** Rebuild a StackBlitz project for a static Omnigraph docs example on demand. */
export function resolveStaticExampleStackBlitzProject(
  exampleId: string,
  integration: StaticExampleStackBlitzIntegration,
): PlaygroundProject {
  const example = getOmnigraphExampleById(exampleId);
  const snippet =
    integration === "enssdk"
      ? buildEnssdkSnippet({ query: example.query, variables: example.variables })
      : buildEnskitSnippet({ query: example.query, variables: example.variables });

  return buildStaticExampleStackBlitzProject(integration, {
    title: `${example.name} using ${integration}`,
    description: example.description,
    snippet,
  });
}
