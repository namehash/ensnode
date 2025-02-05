import type { Labelhash } from "ensnode-utils/types";
import { EnsRainbowApiClient } from "ensrainbow-sdk/client";
import { ErrorCode, StatusCode } from "ensrainbow-sdk/consts";
import { labelHashToBytes } from "ensrainbow-sdk/label-utils";
import type { HealResponse } from "ensrainbow-sdk/types";
import { ensRainbowEndpointUrl } from "./ponder-helpers";

const ensRainbowApiClient = new EnsRainbowApiClient({
  endpointUrl: new URL(ensRainbowEndpointUrl()),
});

/**
 * Heal a labelhash to its original label. It mirrors `ens.nameByHash` function:
 * https://github.com/graphprotocol/graph-node/blob/master/runtime/test/wasm_test/api_version_0_0_4/ens_name_by_hash.ts#L9-L11
 *
 * @returns a healed label for a given labelhash, if possible.
 *
 **/
export async function labelByHash(labelhash: Labelhash): Promise<string | null> {
  // runtime check, ENSRainbow API enforces this validation as well
  labelHashToBytes(labelhash);

  let healResponse: HealResponse;

  try {
    healResponse = await ensRainbowApiClient.heal(labelhash);
  } catch (error) {
    // If the client fails to fetch data, we log the error
    // and return null to the caller.
    console.error(`ENSRainbow Client error ${labelhash}: ${error}`);
    return null;
  }

  if (healResponse.status === StatusCode.Success) {
    return healResponse.label;
  }

  if (healResponse.errorCode === ErrorCode.NotFound) {
    // This is a warning because it's possible that the labelhash is not
    // recorded in the ENSRainbow database.
    console.warn(`Healing labelhash error: '${labelhash}' not found`);

    return null;
  }

  throw new Error(
    `Healing labelhash error ${labelhash}: ${healResponse.error}; error code: ${healResponse.errorCode}`,
  );
}
