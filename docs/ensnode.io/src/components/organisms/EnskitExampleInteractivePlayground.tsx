import { loadEnskitExampleProject } from "src/lib/playground/loadEnskitExampleProject";

import CodePlayground from "../molecules/CodePlayground";

type EnskitExampleInteractivePlaygroundProps = {
  height?: number;
  terminalHeight?: number;
};

const enskitExampleProject = loadEnskitExampleProject();

export default function EnskitExampleInteractivePlayground({
  height = 800,
  terminalHeight = 25,
}: EnskitExampleInteractivePlaygroundProps) {
  return (
    <CodePlayground {...enskitExampleProject} height={height} terminalHeight={terminalHeight} />
  );
}
