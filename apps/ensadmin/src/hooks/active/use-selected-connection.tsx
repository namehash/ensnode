"use client";

import {
  type SelectedConnectionResult,
  useConnectionsLibrary,
} from "@/hooks/use-connections-library";

/**
 * Hook to get the current `SelectedConnectionResult` synchronously.
 *
 * If no `SelectedConnectionResult` is synchronously available, components using
 * this hook will throw. Components that use this hook should be a child of
 * `RequireSelectedConnection` such that the current
 * `SelectedConnectionResult` is synchronously
 * available during render. This simplifies state in components that only make
 * sense within the context of an ENSNode connection already being selected.
 *
 * @returns The current `SelectedConnectionResult`.
 * @throws Error if no ENSNode connection is currently selected.
 */
export function useSelectedConnection(): SelectedConnectionResult {
  const { selectedConnection } = useConnectionsLibrary();

  if (!selectedConnection) {
    throw new Error(`Invariant(useSelectedConnection): Expected a selected ENSNode connection`);
  }

  return selectedConnection;
}

/**
 * Hook to retrieve the current validated `SelectedConnectionResult`'s URL.
 *
 * @throws if `useSelectedConnection` throws
 * @throws if the `validatedSelectedConnection` is not valid
 * @returns validated `SelectedConnectionResult`'s URL
 */
export function useValidatedSelectedConnection(): URL {
  const { validatedSelectedConnection } = useSelectedConnection();
  if (!validatedSelectedConnection.isValid) {
    throw new Error(
      `Invariant: Expected validated selected connection and/or to be child of <SelectedENSNodeProvider />`,
    );
  }

  return validatedSelectedConnection.url;
}
