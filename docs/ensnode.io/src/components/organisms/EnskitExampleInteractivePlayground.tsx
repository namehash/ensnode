import CodePlayground from "@components/molecules/CodePlayground";
import { loadEnskitExampleProject } from "@lib/examples/stackblitz/interactive/loadEnskitExampleProject";

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
