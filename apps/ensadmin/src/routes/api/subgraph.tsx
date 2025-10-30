import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { SubgraphGraphiQLEditor } from "@/components/graphiql-editor";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

export const Route = createFileRoute("/api/subgraph")({
  component: SubgraphGraphQLPage,
});

function SubgraphGraphQLContent() {
  const { validatedSelectedConnection } = useSelectedConnection();

  // TODO: we need a broader refactor to recognize the difference between
  // a selected connection being in a valid format or not.
  if (!validatedSelectedConnection.isValid) {
    return (
      <div className="flex w-full max-w-md items-center space-x-2">
        <span className="font-mono text-xs select-none text-red-500">
          Invalid connection URL: {validatedSelectedConnection.error}
        </span>
      </div>
    );
  }

  const url = new URL(`/subgraph`, validatedSelectedConnection.url).toString();

  return <SubgraphGraphiQLEditor url={url} />;
}

function SubgraphGraphQLPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-screen">
          <LoadingSpinner className="h-16 w-16" />
        </div>
      }
    >
      <SubgraphGraphQLContent />
    </Suspense>
  );
}
