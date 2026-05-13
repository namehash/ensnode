import sdk, { type EmbedOptions, type Project } from "@stackblitz/sdk";
import { useEffect, useRef } from "react";

interface CodePlaygroundProps {
  title: string;
  description?: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  entryFileName?: string;
  height?: number;
  terminalHeight?: number;
}

export default function CodePlayground({
  title,
  description,
  files,
  dependencies,
  entryFileName = "index.ts",
  height = 500,
  terminalHeight = 35,
}: CodePlaygroundProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const packageJson = JSON.stringify(
      {
        name: title.toLowerCase().replace(/\s+/g, "-"),
        version: "0.0.0",
        private: true,
        type: "module",
        scripts: { start: `tsx ${entryFileName}` },
        dependencies: { tsx: "latest", ...dependencies },
      },
      null,
      2,
    );

    const tsconfig = JSON.stringify(
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

    const projectFiles = {
      "package.json": packageJson,
      "tsconfig.json": tsconfig,
      ...files,
    };

    const project = {
      title,
      description,
      template: "node",
      files: projectFiles,
    } as Project;
    const options = {
      openFile: entryFileName,
      terminalHeight,
      height,
      hideNavigation: true,
      hideExplorer: true,
      hideDevTools: true,
      showSidebar: false,
      view: "editor",
      theme: "light",
    } as EmbedOptions;

    sdk.embedProject(ref.current, project, options);
  }, []);

  return (
    <div className="not-content">
      <div ref={ref} />
    </div>
  );
}
