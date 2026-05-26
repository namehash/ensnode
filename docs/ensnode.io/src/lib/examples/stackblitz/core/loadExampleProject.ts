import { assemblePlaygroundProject } from "./assemblePlaygroundProject";
import { buildNodePlaygroundTsconfig } from "./buildPlaygroundTsconfig";
import type { ExampleProjectConfig, PlaygroundProject } from "./types";

export function loadExampleProject(config: ExampleProjectConfig): PlaygroundProject {
  const raw = config.fetchRaw();
  const { dependencies, devDependencies } = config.resolvePackageManifest();
  const tsconfig = config.buildTsconfig?.() ?? buildNodePlaygroundTsconfig();

  const project = assemblePlaygroundProject({
    title: config.title,
    description: config.description,
    runtime: config.runtime,
    view: config.view,
    entryFileName: config.entryFileName,
    openFile: config.openFile,
    transformed: raw,
    dependencies,
    devDependencies,
    tsconfig,
  });

  return project;
}
