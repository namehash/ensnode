import { createFileRoute } from "@tanstack/react-router";

import VisualizerClient from "@/components/visualizer/client";

export const Route = createFileRoute("/inspect/visualizer")({
  component: InspectorPage,
});

function InspectorPage() {
  return (
    <div className="bg-[#F7F9FB] h-full">
      <VisualizerClient />
    </div>
  );
}
