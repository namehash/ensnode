"use client";

import { type PropsWithChildren, useMemo } from "react";

import { createEnsNodeProviderOptions, EnsNodeProvider } from "@ensnode/ensnode-react";

import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

/**
 * Provider component that configures EnsNodeProvider with the currently
 * selected ENSNode connection.
 *
 * This component wraps the EnsNodeProvider from @ensnode/ensnode-react and
 * automatically configures it with the URL from the currently selected ENSNode
 * connection URL. It serves as a bridge between the ENSAdmin connection
 * management system and the ENSNode React hooks.
 *
 * @param children - React children to render within the provider context
 */
export function SelectedEnsNodeProvider({ children }: PropsWithChildren) {
  const selectedConnection = useSelectedConnection();

  const options = useMemo(() => {
    if (!selectedConnection.validatedSelectedConnection.isValid) {
      return undefined;
    }

    return createEnsNodeProviderOptions({
      url: selectedConnection.validatedSelectedConnection.url,
    });
  }, [selectedConnection.validatedSelectedConnection]);

  if (!selectedConnection.validatedSelectedConnection.isValid) {
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

  // invariant to satisfy the type system - this is guaranteed by the logic above
  if (!options) {
    throw new Error("Options must be defined if the selected connection is valid");
  }

  return <EnsNodeProvider options={options}>{children}</EnsNodeProvider>;
}
