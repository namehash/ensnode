"use client";

import { ScalarApiReference } from "@ensnode/scalar-react";

import { RequireENSAdminFeature } from "@/components/require-ensadmin-feature";
import { useOpenApiUrl } from "@/hooks/active/use-openapi-url";
import { useValidatedSelectedConnection } from "@/hooks/active/use-selected-connection";

function RestApiPage() {
  const url = useOpenApiUrl();
  const selectedConnection = useValidatedSelectedConnection();

  return <ScalarApiReference url={url} serverUrl={selectedConnection.toString()} />;
}

export default function Page() {
  return (
    <RequireENSAdminFeature title="REST API Reference" feature="restApi">
      <RestApiPage />
    </RequireENSAdminFeature>
  );
}
