import sdk, { type EmbedOptions } from "@stackblitz/sdk";
import { useEffect, useMemo, useRef } from "react";

import { buildStackBlitzProjectPayload } from "@lib/examples/stackblitz/sdk/buildPayload";
import type { PlaygroundProject } from "@lib/examples/stackblitz/core/types";
import { stackBlitzViewForPlayground } from "@lib/examples/stackblitz/sdk/viewOptions";

type CodePlaygroundProps = PlaygroundProject & {
  height?: number;
  terminalHeight?: number;
};

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
        view: stackBlitzViewForPlayground(view),
        // embed project should use light theme because it's used in the docs
        theme: "light",
        crossOriginIsolated: true,
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
