import { loadEnssdkExampleProject } from "src/lib/playground/loadEnssdkExampleProject";
import { getNiceHeightForCodeSnippet } from "src/lib/playground/utils";

import CodePlayground from "../molecules/CodePlayground";

type EnssdkExampleInteractivePlaygroundProps = {
  height?: number;
  terminalHeight?: number;
};

const enssdkExampleProject = loadEnssdkExampleProject();

export default function EnssdkExampleInteractivePlayground({
  height,
  terminalHeight,
}: EnssdkExampleInteractivePlaygroundProps) {
  const entrySource = enssdkExampleProject.files[enssdkExampleProject.entryFileName] ?? "";
  const resolvedHeight = height ?? getNiceHeightForCodeSnippet(entrySource);

  return (
    <CodePlayground
      {...enssdkExampleProject}
      height={resolvedHeight}
      terminalHeight={terminalHeight}
    />
  );
}
