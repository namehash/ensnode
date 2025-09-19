import { useActiveENSNodeConfig } from "./use-active-ensnode-config";

// helper for accessing the active ENSNode's Config's Namespace
export const useActiveNamespace = () => useActiveENSNodeConfig().namespace;
