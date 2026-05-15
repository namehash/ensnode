import { ENSNODE_URL } from "./constants";
import {
  fetchRawExampleProjectFromGlob,
  mergeRawExampleProjects,
} from "./example-project/fetchRawExampleProject";
import { buildViteReactPlaygroundTsconfig } from "./example-project/buildPlaygroundTsconfig";
import { loadExampleProject } from "./example-project/loadExampleProject";
import { resolveEnskitExamplePackageManifest } from "./example-project/resolvePinnedDependencies";
import type { PlaygroundProject } from "./example-project/types";

const enskitExampleSourceModules = import.meta.glob(
  "../../../../../examples/enskit-react-example/src/**/*.{ts,tsx}",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const enskitExampleRootModules = import.meta.glob(
  "../../../../../examples/enskit-react-example/{index.html,vite.config.ts}",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const EXAMPLE_PATH_PREFIX = "examples/enskit-react-example";

export function loadEnskitExampleProject(): PlaygroundProject {
  return loadExampleProject({
    title: "enskit-react-example",
    description: "React + Vite demo app for enskit.",
    runtime: "node-vite",
    view: "both",
    entryFileName: "index.html",
    openFile: "src/App.tsx",
    fetchRaw: () =>
      mergeRawExampleProjects(
        fetchRawExampleProjectFromGlob(enskitExampleSourceModules, EXAMPLE_PATH_PREFIX),
        fetchRawExampleProjectFromGlob(enskitExampleRootModules, EXAMPLE_PATH_PREFIX),
      ),
    envReplacements: [],
    resolvePackageManifest: resolveEnskitExamplePackageManifest,
    buildTsconfig: buildViteReactPlaygroundTsconfig,
    extraFiles: {
      ".env": `VITE_ENSNODE_URL=${ENSNODE_URL}\n`,
    },
  });
}
