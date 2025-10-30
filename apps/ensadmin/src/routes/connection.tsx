import { createFileRoute } from "@tanstack/react-router";

import ConnectionInfo from "@/components/connection";

export const Route = createFileRoute("/connection")({
  component: ConnectionPage,
});

function ConnectionPage() {
  return <ConnectionInfo />;
}
