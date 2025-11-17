import type { LabelHash, LiteralLabel } from "@ensnode/ensnode-sdk";
import { ErrorCode, isHealError } from "@ensnode/ensrainbow-sdk";

import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";

const ensRainbowApiClient = getENSRainbowApiClient();

/**
 * Attempt to heal a labelHash to its original label.
 * It mirrors the `ens.nameByHash` function implemented in GraphNode:
 * https://github.com/graphprotocol/graph-node/blob/3c448de/runtime/test/wasm_test/api_version_0_0_4/ens_name_by_hash.ts#L9-L11
 *
 * @returns the original label if found, or null if not found for the labelHash.
 * @throws if the labelHash is not correctly formatted, or server error occurs, or connection error occurs.
 **/
export async function labelByLabelHash(labelHash: LabelHash): Promise<LiteralLabel | null> {
  let response: Awaited<ReturnType<typeof ensRainbowApiClient.heal>>;
  try {
    response = await ensRainbowApiClient.heal(labelHash);
  } catch (error) {
    if (error instanceof Error) {
      error.message = `ENSRainbow Heal Request Failed: ENSRainbow unavailable at '${ensRainbowApiClient.getOptions().endpointUrl}'.`;
    }

    throw error;
  }

  if (isHealError(response)) {
    // no original label found for the labelHash
    if (response.errorCode === ErrorCode.NotFound) return null;

    throw new Error(
      `Error healing labelHash: "${labelHash}". Error (${response.errorCode}): ${response.error}.`,
    );
  }

  // original label found for the labelHash
  return response.label as LiteralLabel;
}
