import {
  buildEnskitSnippet,
  buildEnssdkSnippet,
} from "@lib/examples/omnigraph/build-integration-snippets";
import { getOmnigraphExampleById } from "@data/omnigraph-examples/examples";

import type { PlaygroundProject } from "../core/types";
import { buildStaticExampleStackBlitzProject } from "./buildProject";

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
