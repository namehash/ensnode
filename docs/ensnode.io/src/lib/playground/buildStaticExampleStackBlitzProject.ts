import { ENSNODE_URL } from "@lib/playground/constants";
import { assemblePlaygroundProject } from "@lib/playground/example-project/assemblePlaygroundProject";
import {
  buildNodePlaygroundTsconfig,
  buildViteReactPlaygroundTsconfig,
} from "@lib/playground/example-project/buildPlaygroundTsconfig";
import {
  resolveEnskitExamplePackageManifest,
  resolveEnssdkExamplePackageManifest,
} from "@lib/playground/example-project/resolvePinnedDependencies";
import type { PlaygroundProject } from "@lib/playground/example-project/types";

const ENSKIT_STACKBLITZ_SCAFFOLD_FILES = {
  "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>enskit Omnigraph example</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  "vite.config.ts": `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
`,
  "src/main.tsx": `import { createRoot } from "react-dom/client";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(<App />);
`,
  "src/vite-env.d.ts": '/// <reference types="vite/client" />\n',
} as const;

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
        ".env": `ENSNODE_URL=${ENSNODE_URL}\n`,
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
        ".env": `VITE_ENSNODE_URL=${ENSNODE_URL}\n`,
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
