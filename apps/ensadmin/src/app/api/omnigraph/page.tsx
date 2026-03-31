"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { GRAPHQL_API_EXAMPLE_QUERIES } from "@ensnode/ensnode-sdk/internal";

import { GraphiQLEditor } from "@/components/graphiql-editor";
import { RequireENSAdminFeature } from "@/components/require-ensadmin-feature";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useValidatedSelectedConnection } from "@/hooks/active/use-selected-connection";

function GraphQLPage() {
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
        variables: JSON.stringify(getNamespaceSpecificValue(namespace, variables), null, 2),
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

export default function Page() {
  return (
    <RequireENSAdminFeature title="ENSNode GraphQL API" feature="graphql">
      <GraphQLPage />
    </RequireENSAdminFeature>
  );
}
