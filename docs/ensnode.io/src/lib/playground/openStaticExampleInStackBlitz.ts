import sdk from "@stackblitz/sdk";

import { buildStackBlitzProjectPayload } from "./buildStackBlitzProject";
import type { PlaygroundProject, PlaygroundView } from "./example-project/types";

function openViewForPlayground(view: PlaygroundView | undefined): "editor" | "preview" | "default" {
  switch (view) {
    case "preview":
      return "preview";
    case "both":
      return "default";
    default:
      return "editor";
  }
}

/** Open a docs static example project in a new StackBlitz tab. */
export function openStaticExampleInStackBlitz(project: PlaygroundProject): void {
  void sdk.openProject(buildStackBlitzProjectPayload(project), {
    openFile: project.openFile ?? project.entryFileName,
    newWindow: true,
    view: openViewForPlayground(project.view),
    theme: "light",
    startScript: project.runtime === "node-vite" ? "dev" : "start",
  });
}
