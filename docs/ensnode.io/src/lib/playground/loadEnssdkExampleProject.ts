import { ENSNODE_URL } from "./constants";
import { fetchRawExampleProjectFromGlob } from "./example-project/fetchRawExampleProject";
import { loadExampleProject } from "./example-project/loadExampleProject";
import { resolveEnssdkExamplePackageManifest } from "./example-project/resolvePinnedDependencies";
import type { PlaygroundProject } from "./example-project/types";

const enssdkExampleSourceModules = import.meta.glob(
  "../../../../../examples/enssdk-example/src/**/*",
  { query: "?raw", import: "default", eager: true },
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
    envReplacements: [
      {
        pattern: /const ENSNODE_URL = process\.env\.ENSNODE_URL!;/,
        replacement: `const ENSNODE_URL = ${JSON.stringify(ENSNODE_URL)};`,
      },
    ],
    resolvePackageManifest: resolveEnssdkExamplePackageManifest,
  });
}
