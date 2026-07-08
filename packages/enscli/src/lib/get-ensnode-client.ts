import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";

import { resolveEnsNodeUrl } from "./config";

/**
 * Builds the ENSNode Omnigraph client for the instance resolved from `args` (see
 * {@link resolveEnsNodeUrl}). Shared by the `ensnode` subcommands that query the Omnigraph.
 */
export function getEnsNodeClient(args: Record<string, unknown>) {
  const url = resolveEnsNodeUrl(args).href;
  return createEnsNodeClient({ url }).extend(omnigraph);
}
