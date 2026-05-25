import sdk, { type EmbedOptions } from "@stackblitz/sdk";
import { useEffect, useMemo, useRef } from "react";

import { buildStackBlitzProjectPayload } from "src/lib/playground/buildStackBlitzProject";
import type { PlaygroundProject, PlaygroundView } from "src/lib/playground/example-project/types";

type CodePlaygroundProps = PlaygroundProject & {
  height?: number;
  terminalHeight?: number;
};

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

  const project = useMemo(
    () =>
      buildStackBlitzProjectPayload({
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
      }),
    [
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
    ],
  );

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

  // `project` and `embedOptions` are memoized from all embed-affecting props.
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let disposed = false;

    void (async () => {
      container.replaceChildren();
      await sdk.embedProject(container, project, embedOptions);
      if (disposed) container.replaceChildren();
    })();

    return () => {
      disposed = true;
      container.replaceChildren();
    };
  }, [project, embedOptions]);

  return (
    <div className="not-content">
      <div ref={ref} />
    </div>
  );
}
