import { EnsRainbowApiClient, ErrorCode, isHealError } from "@ensnode/ensrainbow-sdk";
import type { Labelhash } from "@ensnode/utils";

import { ensRainbowEndpointUrl } from "@/lib/ponder-helpers";

const ensRainbowApiClient = new EnsRainbowApiClient({
  endpointUrl: new URL(ensRainbowEndpointUrl()),
});

if (
  ensRainbowApiClient.getOptions().endpointUrl === EnsRainbowApiClient.defaultOptions().endpointUrl
) {
  console.warn(
    `Using default public ENSRainbow server which may cause increased network latency.
    For production, use your own ENSRainbow server that runs on the same network
    as the ENSIndexer server.`,
  );
}

/**
 * Attempt to heal a labelhash to its original label.
 * It mirrors the `ens.nameByHash` function implemented in GraphNode:
 * https://github.com/graphprotocol/graph-node/blob/3c448de/runtime/test/wasm_test/api_version_0_0_4/ens_name_by_hash.ts#L9-L11
 *
 * @returns the original label if found, or null if not found for the labelhash.
 * @throws if the labelhash is not correctly formatted, or server error occurs, or connection error occurs.
 **/
export async function labelByHash(labelhash: Labelhash): Promise<string | null> {
  const healResponse = await ensRainbowApiClient.heal(labelhash);

  if (!isHealError(healResponse)) {
    // original label found for the labelhash
    return healResponse.label;
  }

  if (healResponse.errorCode === ErrorCode.NotFound) {
    // no original label found for the labelhash
    return null;
  }

  throw new Error(
    `Error healing labelhash: "${labelhash}". Error (${healResponse.errorCode}): ${healResponse.error}.`,
  );
}
