import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";
import type { LabelHash, LiteralLabel } from "@ensnode/ensnode-sdk";
import { ErrorCode, isHealError } from "@ensnode/ensrainbow-sdk";

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
  const response = await ensRainbowApiClient.heal(labelHash);

  if (isHealError(response)) {
    throw new Error(
      `Error healing labelHash: "${labelHash}". Error (${response.errorCode}): ${response.error}.`,
    );
  }

  // no original label found for the labelHash
  if (response.errorCode === ErrorCode.NotFound) return null;

  // original label found for the labelHash
  return response.label as LiteralLabel;
}
