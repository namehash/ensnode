"use client";

import { useMemo } from "react";

import { ScalarApiReference } from "@ensnode/scalar-react";

import { RequireENSAdminFeature } from "@/components/require-ensadmin-feature";
import { useValidatedSelectedConnection } from "@/hooks/active/use-selected-connection";

function RestApiPage() {
  const selectedConnection = useValidatedSelectedConnection();
  const url = useMemo(
    () => new URL("/openapi.json", selectedConnection).toString(),
    [selectedConnection],
  );

  return <ScalarApiReference url={url} />;
}

export default function Page() {
  return (
    <RequireENSAdminFeature title="REST API Reference" feature="restApi">
      <RestApiPage />
    </RequireENSAdminFeature>
  );
}
