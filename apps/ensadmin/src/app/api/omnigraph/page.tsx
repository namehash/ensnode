"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { GraphiQLEditor } from "@/components/graphiql-editor";
import { RequireENSAdminFeature } from "@/components/require-ensadmin-feature";
import { useValidatedSelectedConnection } from "@/hooks/active/use-selected-connection";

function GraphQLPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");
  const initialVariables = searchParams.get("variables");

  const selectedConnection = useValidatedSelectedConnection();
  const url = useMemo(
    () => new URL(`/api/omnigraph`, selectedConnection).toString(),
    [selectedConnection],
  );

  return (
    <GraphiQLEditor
      url={url}
      initialQuery={initialQuery || undefined}
      initialVariables={initialVariables || undefined}
    />
  );
}

export default function Page() {
  return (
    <RequireENSAdminFeature title="ENSNode Omnigraph API" feature="omnigraph">
      <GraphQLPage />
    </RequireENSAdminFeature>
  );
}
