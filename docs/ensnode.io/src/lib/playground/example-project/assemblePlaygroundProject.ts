import type { PlaygroundProject, TransformedExampleProject } from "./types";

export function assemblePlaygroundProject(params: {
  title: string;
  description?: string;
  template: PlaygroundProject["template"];
  view?: PlaygroundProject["view"];
  entryFileName: string;
  openFile?: string;
  transformed: TransformedExampleProject;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  tsconfig: string;
}): PlaygroundProject {
  const { transformed, tsconfig, dependencies, devDependencies, ...meta } = params;

  return {
    ...meta,
    files: {
      ...transformed.files,
      "tsconfig.json": tsconfig,
    },
    dependencies,
    devDependencies,
    openFile: meta.openFile ?? meta.entryFileName,
  };
}
