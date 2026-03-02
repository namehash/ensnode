"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { GraphiQLEditor } from "@/components/graphiql-editor";
import { RequireENSAdminFeature } from "@/components/require-ensadmin-feature";
import { useValidatedSelectedConnection } from "@/hooks/active/use-selected-connection";

const defaultQuery = `# Welcome to this interactive playground for
# ENSNode's Subgraph-Compatible GraphQL API!
#
# You can get started by typing your query here or by using
# the Explorer on the left to select the data
# you want to query.
#
# When you are ready to execute your query,
# press the pink Play icon -->
#
`;

function SubgraphGraphQLPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || defaultQuery;
  const initialVariables = searchParams.get("variables") || "";

  const selectedConnection = useValidatedSelectedConnection();
  const url = useMemo(
    () => new URL(`/subgraph`, selectedConnection).toString(),
    [selectedConnection],
  );

  return (
    <GraphiQLEditor url={url} initialQuery={initialQuery} initialVariables={initialVariables} />
  );
}

export default function Page() {
  return (
    <RequireENSAdminFeature title="Subgraph-Compatible GraphQL API" feature="subgraph">
      <SubgraphGraphQLPage />
    </RequireENSAdminFeature>
  );
}
