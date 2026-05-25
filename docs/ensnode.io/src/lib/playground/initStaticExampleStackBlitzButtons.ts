import { openStaticExampleInStackBlitz } from "./openStaticExampleInStackBlitz";
import {
  resolveStaticExampleStackBlitzProject,
  type StaticExampleStackBlitzIntegration,
} from "./resolveStaticExampleStackBlitzProject";

let initialized = false;

function parseIntegration(value: string | undefined): StaticExampleStackBlitzIntegration | null {
  if (value === "enssdk" || value === "enskit") {
    return value;
  }
  return null;
}

/** Wire click handlers for static example StackBlitz buttons (once per page). */
export function initStaticExampleStackBlitzButtons(): void {
  if (initialized) return;
  initialized = true;

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest("[data-static-example-id]");
    if (!(button instanceof HTMLButtonElement)) return;

    const exampleId = button.dataset.staticExampleId;
    if (!exampleId) return;

    const panel = button.closest("[data-integration-panel]");
    const integration = parseIntegration(
      panel?.getAttribute("data-integration-panel") ?? undefined,
    );
    if (!integration) return;

    openStaticExampleInStackBlitz(resolveStaticExampleStackBlitzProject(exampleId, integration));
  });
}
