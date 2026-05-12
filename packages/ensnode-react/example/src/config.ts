import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";
import { ENSNamespaceSchema, makeUrlSchema } from "@ensnode/ensnode-sdk/internal";

// TODO: potential internal to be made public
const DEFAULT_ENSNODE_URL = "https://api.alpha.green.ensnode.io";

export const ENSNODE_URL: URL = makeUrlSchema("VITE_ENSNODE_URL").parse(
  import.meta.env.VITE_ENSNODE_URL ?? DEFAULT_ENSNODE_URL,
);

export const EXPECTED_NAMESPACE: ENSNamespaceId = ENSNamespaceSchema.parse(
  import.meta.env.VITE_ENS_NAMESPACE ?? ENSNamespaceIds.Mainnet,
);
