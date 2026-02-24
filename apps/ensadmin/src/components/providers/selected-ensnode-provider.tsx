"use client";

import type { PropsWithChildren } from "react";

import { createEnsApiOptions, EnsApiProvider } from "@ensnode/ensnode-react";

import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

/**
 * Provider component that configures EnsApiProvider with the currently
 * selected ENSNode connection.
 *
 * This component wraps the EnsApiProvider from @ensnode/ensnode-react and
 * automatically configures it with the URL from the currently selected ENSNode
 * connection URL. It serves as a bridge between the connection management
 * system and the ENSNode React hooks.
 *
 * @param children - React children to render within the provider context
 */
export function SelectedEnsApiProvider({ children }: PropsWithChildren) {
  const selectedConnection = useSelectedConnection();

  if (selectedConnection.validatedSelectedConnection.isValid) {
    const options = createEnsApiOptions({
      url: selectedConnection.validatedSelectedConnection.url,
    });
    return <EnsApiProvider options={options}>{children}</EnsApiProvider>;
  } else {
    // TODO: Logic here needs a deeper refactor to recognize the difference
    // between the selected connection being in a valid format or not.
    // This logic will throw and an error and break if the selected connection
    // is in an invalid format.

    return (
      <div>
        Invalid connection: "{selectedConnection.rawSelectedConnection}" (
        {selectedConnection.validatedSelectedConnection.error})
      </div>
    );
  }
}
