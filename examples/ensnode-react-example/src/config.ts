import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";

const DEFAULT_ENSNODE_URL = "https://api.alpha.ensnode.io";

function parseEnsNodeUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error(`VITE_ENSNODE_ULR must be a valid URL. Got: '${value}'.`);
  }
}

function parseExpectedNamespace(value: string): ENSNamespaceId {
  const validIds = Object.values(ENSNamespaceIds) as readonly string[];
  if (!validIds.includes(value)) {
    throw new Error(`VITE_ENS_NAMESPACE must be one of: ${validIds.join(", ")}. Got: '${value}'.`);
  }
  return value as ENSNamespaceId;
}

export const ENSNODE_URL: URL = parseEnsNodeUrl(
  import.meta.env.VITE_ENSNODE_URL ?? DEFAULT_ENSNODE_URL,
);

export const EXPECTED_NAMESPACE: ENSNamespaceId = parseExpectedNamespace(
  import.meta.env.VITE_ENS_NAMESPACE ?? ENSNamespaceIds.Mainnet,
);
