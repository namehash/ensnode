import { isLabelIndexable } from "ensnode-utils/subname-helpers";
import type { Labelhash } from "ensnode-utils/types";
import { EnsRainbowApiClient } from "ensrainbow-sdk/client";
import { DEFAULT_ENSRAINBOW_URL } from "ensrainbow-sdk/consts";
import { labelHashToBytes } from "ensrainbow-sdk/label-utils";
import { normalize } from "viem/ens";

const ensRainbowApiClient = new EnsRainbowApiClient({
  endpointUrl: new URL(process.env.ENSRAINBOW_URL || DEFAULT_ENSRAINBOW_URL),
});

/**
 * Heal a labelhash to its original label.
 *
 * @returns a healed label for a given labelhash, if possible.
 *
 * NOTE: undefined return type is helpful for passing to drizzle, which
 * will ignore the input rather that set the value in the db to `NULL`
 * if we were to return `null`.
 **/
export async function heal(labelhash: Labelhash) {
  try {
    // runtime check, ENS rainbow encodes this logic as well
    labelHashToBytes(labelhash);
  } catch (error) {
    console.error(`Invalid labelhash - must be a valid hex string: ${error}`);

    return undefined;
  }

  const healResponse = await ensRainbowApiClient.heal(labelhash);

  if (healResponse.status === "error") {
    console.error(`Error healing labelhash ${labelhash}: ${healResponse.error}`);

    return undefined;
  }

  const { label } = healResponse;

  // if the indexer can't store the label yet, consider it unhealable
  if (!isLabelIndexable(label)) {
    return undefined;
  }

  // if the label isn't normalized, consider it unhealable
  if (label !== normalize(label)) {
    return undefined;
  }

  // this is a healed, normalized label that the indexer can store
  return label;
}
