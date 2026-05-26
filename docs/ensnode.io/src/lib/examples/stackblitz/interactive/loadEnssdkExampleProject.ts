import { fetchRawExampleProjectFromGlob } from "../core/fetchRawExampleProject";
import { loadExampleProject } from "../core/loadExampleProject";
import { resolveEnssdkExamplePackageManifest } from "../core/resolvePinnedDependencies";
import type { PlaygroundProject } from "../core/types";

const enssdkExampleSourceModules = import.meta.glob(
  "../../../../../../../examples/enssdk-example/src/**/*.{ts,tsx}",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

export function loadEnssdkExampleProject(): PlaygroundProject {
  return loadExampleProject({
    title: "enssdk-example",
    description: "Query the eth domain and its subdomains with enssdk.",
    runtime: "node-tsx",
    view: "editor",
    entryFileName: "src/index.ts",
    fetchRaw: () =>
      fetchRawExampleProjectFromGlob(enssdkExampleSourceModules, "examples/enssdk-example"),
    resolvePackageManifest: resolveEnssdkExamplePackageManifest,
  });
}
