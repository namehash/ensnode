import CodePlayground from "@components/molecules/CodePlayground";
import { getNiceHeightForCodeSnippet } from "@lib/examples/stackblitz/interactive/embedHeight";
import { loadEnssdkExampleProject } from "@lib/examples/stackblitz/interactive/loadEnssdkExampleProject";

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
