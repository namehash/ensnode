import { openStackBlitzProject } from "../sdk/openProject";
import {
  resolveStaticExampleStackBlitzProject,
  type StaticExampleStackBlitzIntegration,
} from "./resolveProject";

/** Resolve and open a static Omnigraph docs example in StackBlitz. */
export function openStaticExampleFromId(
  exampleId: string,
  integration: StaticExampleStackBlitzIntegration,
): void {
  openStackBlitzProject(resolveStaticExampleStackBlitzProject(exampleId, integration));
}

export type { StaticExampleStackBlitzIntegration } from "./resolveProject";
