import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";

// you may use a NameHash Hosted ENSNode instance
// learn more at https://ensnode.io/docs/hosted-instances
export const ENSNODE_URL = import.meta.env.VITE_ENSNODE_URL ?? "https://api.v2-sepolia.ensnode.io";

/**
 * Constructs an EnsNodeClient and extends it with the Omnigraph module.
 *
 * Shared by the React `OmnigraphProvider` (for `useOmnigraphQuery`) and by views
 * that issue Omnigraph queries imperatively via `client.omnigraph.query(...)`.
 */
export const client = createEnsNodeClient({ url: ENSNODE_URL }).extend(omnigraph);
