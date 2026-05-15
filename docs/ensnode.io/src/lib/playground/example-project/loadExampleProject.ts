import { assemblePlaygroundProject } from "./assemblePlaygroundProject";
import { buildNodePlaygroundTsconfig } from "./buildPlaygroundTsconfig";
import { replaceEnvWithValues } from "./replaceEnvWithValues";
import type { ExampleProjectConfig, PlaygroundProject } from "./types";

export function loadExampleProject(config: ExampleProjectConfig): PlaygroundProject {
  const raw = config.fetchRaw();
  const transformed = replaceEnvWithValues(raw, config.envReplacements);
  const { dependencies, devDependencies } = config.resolvePackageManifest();
  const tsconfig = config.buildTsconfig?.() ?? buildNodePlaygroundTsconfig();

  return assemblePlaygroundProject({
    title: config.title,
    description: config.description,
    template: config.template,
    view: config.view,
    entryFileName: config.entryFileName,
    openFile: config.openFile,
    transformed,
    dependencies,
    devDependencies,
    tsconfig,
  });
}
