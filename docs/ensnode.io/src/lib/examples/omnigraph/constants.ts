import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";

/** TODO: Update all to the latest ENSNode URL */
/** Sepolia v2 namespace — matches the public v2 Sepolia ENSNode URL in docs playgrounds. */
export const DOCS_OMNIGRAPH_NAMESPACE = ENSNamespaceIds.Mainnet;

/** Heading anchor for the docs playground instance (`#### ENSNode 'Alpha'` on /docs/hosted-instances). */
export const DOCS_HOSTED_INSTANCE_ANCHOR = "ensnode-alpha";

/** Human-readable label for {@link DOCS_HOSTED_INSTANCE_ANCHOR} in example playground hints. */
export const DOCS_HOSTED_INSTANCE_LABEL = "alpha";

/** Production v2 Sepolia ENSNode base URL: the `connection` rendered in the docs Omnigraph examples, the default endpoint the response-refresh script POSTs to, and the `endpoint` recorded in each version snapshot. */
export const ENSNODE_URL = "https://api.alpha.ensnode.io";
