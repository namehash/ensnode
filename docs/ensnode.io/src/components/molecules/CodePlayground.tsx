import sdk, { type EmbedOptions, type Project } from "@stackblitz/sdk";
import { useEffect, useMemo, useRef } from "react";

import type {
  PlaygroundProject,
  PlaygroundRuntime,
  PlaygroundView,
} from "src/lib/playground/example-project/types";

type CodePlaygroundProps = PlaygroundProject & {
  height?: number;
  terminalHeight?: number;
};

/** StackBlitz SDK templates: https://developer.stackblitz.com/platform/api/javascript-sdk-options#projecttemplate */
const STACKBLITZ_WEBCONTAINERS_TEMPLATE = "node" as const;

function buildStartScript(runtime: PlaygroundRuntime, entryFileName: string): string {
  if (runtime === "node-vite") {
    return "vite";
  }
  return `tsx ${entryFileName}`;
}

function embedViewForPlayground(view: PlaygroundView | undefined): EmbedOptions["view"] {
  switch (view) {
    case "preview":
      return "preview";
    case "both":
      return "default";
    default:
      return "editor";
  }
}

export default function CodePlayground({
  title,
  description,
  runtime,
  files,
  dependencies,
  devDependencies,
  entryFileName,
  openFile,
  view,
  tsconfig,
  height = 500,
  terminalHeight = 35,
}: CodePlaygroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const resolvedOpenFile = openFile ?? entryFileName;

  const project = useMemo(() => {
    const defaultTsconfig = JSON.stringify(
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

    const packageJson = JSON.stringify(
      {
        name: title.toLowerCase().replace(/\s+/g, "-"),
        version: "0.0.0",
        private: true,
        type: "module",
        scripts: {
          dev: buildStartScript(runtime, entryFileName),
          start: buildStartScript(runtime, entryFileName),
        },
        dependencies,
        devDependencies,
      },
      null,
      2,
    );

    const projectFiles = {
      "package.json": packageJson,
      ...files,
      "tsconfig.json": files["tsconfig.json"] ?? tsconfig ?? defaultTsconfig,
    };

    return {
      title,
      description,
      template: STACKBLITZ_WEBCONTAINERS_TEMPLATE,
      files: projectFiles,
    } as Project;
  }, [title, description, runtime, files, dependencies, devDependencies, entryFileName, tsconfig]);

  const embedOptions = useMemo(
    () =>
      ({
        openFile: resolvedOpenFile,
        terminalHeight,
        height,
        hideNavigation: true,
        hideExplorer: true,
        hideDevTools: true,
        showSidebar: true,
        view: embedViewForPlayground(view),
        theme: "light",
      }) as EmbedOptions,
    [resolvedOpenFile, terminalHeight, height, view],
  );

  useEffect(() => {
    if (!ref.current) return;
    sdk.embedProject(ref.current, project, embedOptions);
  }, [project, embedOptions]);

  return (
    <div className="not-content">
      <div ref={ref} />
    </div>
  );
}
