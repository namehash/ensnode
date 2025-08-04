import config from "@/config";
import { getENSRainbowApiCLient } from "@/lib/ensraibow-api-client";
import type { Label, LabelHash } from "@ensnode/ensnode-sdk";
import { ErrorCode, isHealError } from "@ensnode/ensrainbow-sdk";

const ensRainbowApiClient = getENSRainbowApiCLient(new URL(config.ensRainbowEndpointUrl));

/**
 * Attempt to heal a labelHash to its original label.
 * It mirrors the `ens.nameByHash` function implemented in GraphNode:
 * https://github.com/graphprotocol/graph-node/blob/3c448de/runtime/test/wasm_test/api_version_0_0_4/ens_name_by_hash.ts#L9-L11
 *
 * @returns the original label if found, or null if not found for the labelHash.
 * @throws if the labelHash is not correctly formatted, or server error occurs, or connection error occurs.
 **/
export async function labelByLabelHash(labelHash: LabelHash): Promise<Label | null> {
  const healResponse = await ensRainbowApiClient.heal(labelHash);

  if (!isHealError(healResponse)) {
    // original label found for the labelHash
    return healResponse.label;
  }

  if (healResponse.errorCode === ErrorCode.NotFound) {
    // no original label found for the labelHash
    return null;
  }

  throw new Error(
    `Error healing labelHash: "${labelHash}". Error (${healResponse.errorCode}): ${healResponse.error}.`,
  );
}
