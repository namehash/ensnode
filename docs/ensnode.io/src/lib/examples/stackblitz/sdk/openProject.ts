import sdk from "@stackblitz/sdk";

import type { PlaygroundProject } from "../core/types";
import { buildStackBlitzProjectPayload } from "./buildPayload";
import { stackBlitzStartScriptForRuntime, stackBlitzViewForPlayground } from "./viewOptions";

/** Open a playground project in a new StackBlitz tab. */
export function openStackBlitzProject(project: PlaygroundProject): void {
  void sdk.openProject(buildStackBlitzProjectPayload(project), {
    openFile: project.openFile ?? project.entryFileName,
    newWindow: true,
    view: stackBlitzViewForPlayground(project.view),
    theme: "light",
    startScript: stackBlitzStartScriptForRuntime(project.runtime),
  });
}
