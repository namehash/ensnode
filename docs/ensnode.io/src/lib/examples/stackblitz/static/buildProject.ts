import { DEFAULT_ENSNODE_URL } from "@lib/examples/omnigraph/constants";

import { assemblePlaygroundProject } from "../core/assemblePlaygroundProject";
import {
  buildNodePlaygroundTsconfig,
  buildViteReactPlaygroundTsconfig,
} from "../core/buildPlaygroundTsconfig";
import {
  resolveEnskitExamplePackageManifest,
  resolveEnssdkExamplePackageManifest,
} from "../core/resolvePinnedDependencies";
import type { PlaygroundProject } from "../core/types";
import { ENSKIT_STACKBLITZ_SCAFFOLD_FILES } from "./enskitScaffold";

function buildEnssdkStaticStackBlitzProject(params: {
  title: string;
  description?: string;
  snippet: string;
}): PlaygroundProject {
  const { dependencies, devDependencies } = resolveEnssdkExamplePackageManifest();

  return assemblePlaygroundProject({
    title: params.title,
    description: params.description ?? "Run this Omnigraph example with enssdk.",
    runtime: "node-tsx",
    view: "editor",
    entryFileName: "src/index.ts",
    transformed: {
      files: {
        ".env": `ENSNODE_URL=${DEFAULT_ENSNODE_URL}\n`,
        "src/index.ts": params.snippet,
      },
    },
    dependencies,
    devDependencies,
    tsconfig: buildNodePlaygroundTsconfig(),
  });
}

function buildEnskitStaticStackBlitzProject(params: {
  title: string;
  description?: string;
  snippet: string;
}): PlaygroundProject {
  const { dependencies, devDependencies } = resolveEnskitExamplePackageManifest();

  return assemblePlaygroundProject({
    title: params.title,
    description: params.description ?? "Run this Omnigraph example with enskit.",
    runtime: "node-vite",
    view: "both",
    entryFileName: "index.html",
    openFile: "src/App.tsx",
    transformed: {
      files: {
        ...ENSKIT_STACKBLITZ_SCAFFOLD_FILES,
        ".env": `VITE_ENSNODE_URL=${DEFAULT_ENSNODE_URL}\n`,
        "src/App.tsx": params.snippet,
      },
    },
    dependencies,
    devDependencies,
    tsconfig: buildViteReactPlaygroundTsconfig(),
  });
}

/** Build a StackBlitz-ready project for a static Omnigraph docs example snippet. */
export function buildStaticExampleStackBlitzProject(
  integration: "enssdk" | "enskit",
  params: { title: string; description?: string; snippet: string },
): PlaygroundProject {
  if (integration === "enssdk") {
    return buildEnssdkStaticStackBlitzProject(params);
  }
  return buildEnskitStaticStackBlitzProject(params);
}
