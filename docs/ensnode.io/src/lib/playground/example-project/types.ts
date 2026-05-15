/** Files as read from the monorepo (paths relative to the example root). */
export type RawExampleProject = {
  files: Record<string, string>;
};

/** After text transforms, before StackBlitz-specific assembly. */
export type TransformedExampleProject = RawExampleProject;

export type PlaygroundTemplate = "node" | "vite";

export type PlaygroundView = "editor" | "preview" | "both";

/** npm `package.json` dependency blocks for the StackBlitz embed. */
export type PlaygroundPackageManifest = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

/** What {@link import("../../../components/molecules/CodePlayground").default} consumes. */
export type PlaygroundProject = {
  title: string;
  description?: string;
  template: PlaygroundTemplate;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  entryFileName: string;
  openFile?: string;
  view?: PlaygroundView;
  tsconfig?: string;
};

export type EnvReplacement = {
  pattern: RegExp;
  replacement: string;
};

export type ExampleProjectConfig = {
  title: string;
  description?: string;
  template: PlaygroundTemplate;
  view?: PlaygroundView;
  entryFileName: string;
  openFile?: string;
  fetchRaw: () => RawExampleProject;
  envReplacements: EnvReplacement[];
  resolvePackageManifest: () => PlaygroundPackageManifest;
  buildTsconfig?: () => string;
};
