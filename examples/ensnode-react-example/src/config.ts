import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";

const DEFAULT_ENSNODE_URL = "https://api.alpha.ensnode.io";

const VALID_NAMESPACE_IDS: readonly ENSNamespaceId[] = Object.values(ENSNamespaceIds);

function isENSNamespaceId(value: string): value is ENSNamespaceId {
  return VALID_NAMESPACE_IDS.some((id) => id === value);
}

function parseEnsNodeUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error(`VITE_ENSNODE_URL must be a valid URL. Got: '${value}'.`);
  }
}

function parseExpectedNamespace(value: string): ENSNamespaceId {
  if (!isENSNamespaceId(value)) {
    throw new Error(
      `VITE_ENS_NAMESPACE must be one of: ${VALID_NAMESPACE_IDS.join(", ")}. Got: '${value}'.`,
    );
  }
  return value;
}

export const ENSNODE_URL: URL = parseEnsNodeUrl(
  import.meta.env.VITE_ENSNODE_URL ?? DEFAULT_ENSNODE_URL,
);

export const EXPECTED_NAMESPACE: ENSNamespaceId = parseExpectedNamespace(
  import.meta.env.VITE_ENS_NAMESPACE ?? ENSNamespaceIds.Mainnet,
);
