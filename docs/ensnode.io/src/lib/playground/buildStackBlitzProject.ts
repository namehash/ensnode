import type { Project } from "@stackblitz/sdk";

import type { PlaygroundProject, PlaygroundRuntime } from "./example-project/types";

/** StackBlitz SDK templates: https://developer.stackblitz.com/platform/api/javascript-sdk-options#projecttemplate */
export const STACKBLITZ_WEBCONTAINERS_TEMPLATE = "node" as const;

export function buildStackBlitzStartScript(
  runtime: PlaygroundRuntime,
  entryFileName: string,
): string {
  if (runtime === "node-vite") {
    return "vite";
  }
  return `tsx ${entryFileName}`;
}

export function buildStackBlitzPackageJson(project: PlaygroundProject): string {
  return JSON.stringify(
    {
      name: project.title.toLowerCase().replace(/\s+/g, "-"),
      version: "0.0.0",
      private: true,
      type: "module",
      scripts: {
        dev: buildStackBlitzStartScript(project.runtime, project.entryFileName),
        start: buildStackBlitzStartScript(project.runtime, project.entryFileName),
      },
      dependencies: project.dependencies,
      devDependencies: project.devDependencies,
    },
    null,
    2,
  );
}

const defaultNodeTsconfig = JSON.stringify(
  {
    compilerOptions: {
      target: "es2022",
      module: "nodenext",
      moduleResolution: "nodenext",
      strict: true,
    },
  },
  null,
  2,
);

/** Build the StackBlitz SDK `Project` payload from a docs playground project definition. */
export function buildStackBlitzProjectPayload(project: PlaygroundProject): Project {
  return {
    title: project.title,
    description: project.description,
    template: STACKBLITZ_WEBCONTAINERS_TEMPLATE,
    files: {
      "package.json": buildStackBlitzPackageJson(project),
      ...project.files,
      "tsconfig.json": project.files["tsconfig.json"] ?? project.tsconfig ?? defaultNodeTsconfig,
    },
  };
}
