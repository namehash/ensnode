import type { PlaygroundRuntime, PlaygroundView } from "../core/types";

export function stackBlitzViewForPlayground(
  view: PlaygroundView | undefined,
): "editor" | "preview" | "default" {
  switch (view) {
    case "preview":
      return "preview";
    case "both":
      return "default";
    default:
      return "editor";
  }
}

export function stackBlitzStartScriptForRuntime(runtime: PlaygroundRuntime): "dev" | "start" {
  return runtime === "node-vite" ? "dev" : "start";
}
