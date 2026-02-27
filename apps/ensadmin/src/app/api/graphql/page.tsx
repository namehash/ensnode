"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { GRAPHQL_API_EXAMPLE_QUERIES } from "@ensnode/ensnode-sdk/internal";

import { GraphiQLEditor } from "@/components/graphiql-editor";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

export default function SubgraphGraphQLPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");
  const initialVariables = searchParams.get("variables");

  const namespace = useActiveNamespace();
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

  const url = useMemo(
    () => new URL(`/api/graphql`, validatedSelectedConnection.url).toString(),
    [validatedSelectedConnection],
  );

  const defaultTabs = useMemo(
    () =>
      GRAPHQL_API_EXAMPLE_QUERIES.map(({ query, variables }) => ({
        query: query.trim(),
        variables: JSON.stringify(variables[namespace] ?? variables.default, null, 2),
      })),
    [namespace],
  );

  return (
    <GraphiQLEditor
      url={url}
      initialQuery={initialQuery || undefined}
      initialVariables={initialVariables || undefined}
      defaultTabs={defaultTabs}
    />
  );
}
