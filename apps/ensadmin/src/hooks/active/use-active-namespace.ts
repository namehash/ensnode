import { useActiveConnection } from "./use-active-connection";

/**
 * Hook to get the namespace from the currently active ENSNode configuration synchronously.
 *
 * This is a helper hook for accessing the active ENSNode's Config's Namespace.
 * If the connected ENSNode's Config is not synchronously available, components using
 * this hook will throw. Components that use this hook should be a child of
 * `RequireActiveConnection` such that the connected ENSNode's config is synchronously
 * available during render. This simplifies state in components that only make sense
 * within the context of a connected ENSNode.
 *
 * @returns The namespace from the active ENSNode configuration
 * @throws Error if no active ENSNode Config is available
 */
export const useActiveNamespace = () => useActiveConnection().namespace;
