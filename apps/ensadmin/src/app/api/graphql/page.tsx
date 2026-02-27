"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { GRAPHQL_API_EXAMPLE_QUERIES } from "@ensnode/ensnode-sdk/internal";

import { GraphiQLEditor } from "@/components/graphiql-editor";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useValidatedSelectedConnection } from "@/hooks/active/use-selected-connection";

export default function SubgraphGraphQLPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");
  const initialVariables = searchParams.get("variables");

  const namespace = useActiveNamespace();
  const selectedConnection = useValidatedSelectedConnection();
  const url = useMemo(
    () => new URL(`/api/graphql`, selectedConnection).toString(),
    [selectedConnection],
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
