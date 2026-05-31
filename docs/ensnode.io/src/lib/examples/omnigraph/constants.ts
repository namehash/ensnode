import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";

/** TODO: Update all to the latest ENSNode URL */
/** Sepolia v2 namespace — matches the public v2 Sepolia ENSNode URL in docs playgrounds. */
export const DOCS_OMNIGRAPH_NAMESPACE = ENSNamespaceIds.SepoliaV2;

/** Heading anchor for the docs playground instance (`#### ENSNode 'v2 Sepolia'` on /docs/hosted-instances). */
export const DOCS_HOSTED_INSTANCE_ANCHOR = "ensnode-v2-sepolia";

/** Production v2 Sepolia ENSNode base URL: the `connection` rendered in the docs Omnigraph examples, the default endpoint the response-refresh script POSTs to, and the `endpoint` recorded in each version snapshot. */
export const ENSNODE_URL = "https://api.v2-sepolia.ensnode.io";
