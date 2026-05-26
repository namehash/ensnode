/** Files as read from the monorepo (paths relative to the example root). */
export type RawExampleProject = {
  files: Record<string, string>;
};

/** After text transforms, before StackBlitz-specific assembly. */
export type TransformedExampleProject = RawExampleProject;

/** How the playground runs after `npm install` (always on StackBlitz `template: "node"`). */
export type PlaygroundRuntime = "node-tsx" | "node-vite";

export type PlaygroundView = "editor" | "preview" | "both";

/** npm `package.json` dependency blocks for the StackBlitz embed. */
export type PlaygroundPackageManifest = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

/** What {@link import("@components/molecules/CodePlayground").default} consumes. */
export type PlaygroundProject = {
  title: string;
  description?: string;
  runtime: PlaygroundRuntime;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  entryFileName: string;
  openFile?: string;
  view?: PlaygroundView;
  tsconfig?: string;
};

export type ExampleProjectConfig = {
  title: string;
  description?: string;
  runtime: PlaygroundRuntime;
  view?: PlaygroundView;
  entryFileName: string;
  openFile?: string;
  fetchRaw: () => RawExampleProject;
  resolvePackageManifest: () => PlaygroundPackageManifest;
  buildTsconfig?: () => string;
};
