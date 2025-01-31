import { isUnknownLabel, unknownLabelAsHex } from "ensnode-utils/subname-helpers";
import { Hex } from "viem";

interface ENSRainbow {
  /**
   * Attempts to heal the given label. For healed labels,
   * it also heals the name if provided.
   */
  heal<Label extends string, Name extends string | null>(
    label: Label,
    name: Name,
  ): Promise<[Label, Name] | null>;
}

/**
 * A factory function to create an instance of ENSRainbow.
 * @param ensRainbowApiUrl
 * @returns
 */
function createLabelHealing(ensRainbowApiUrl: URL): ENSRainbow {
  /**
   * Fetches the healed label for the given unknown label.
   * @param labelhash a hash of the unknown label
   * @returns healed label if available
   */
  async function fetchHealedLabel(labelhash: Hex) {
    const response = await fetch(new URL(`/v1/heal/${labelhash}`, ensRainbowApiUrl).toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch healed label: ${response.statusText}`);
    }

    return response.text();
  }

  return {
    async heal(label, name) {
      // first, let's make sure this is an encoded unknown label
      if (!isUnknownLabel(label)) {
        return null;
      }

      try {
        const healedLabel = await fetchHealedLabel(unknownLabelAsHex(label));

        if (!healedLabel) {
          return null;
        }

        // If the name is provided, try to heal it as well
        const healedName = name ? name.replaceAll(label, healedLabel) : null;

        return [healedLabel, healedName] as [typeof label, typeof name];
      } catch (error: any) {
        console.error("Failed to heal label", label, error.message);
        return null;
      }
    },
  } satisfies ENSRainbow;
}

const DEFAULT_ENSRAINBOW_API_URL = "https://api.ensrainbow.io";

export const labelHealing = createLabelHealing(
  new URL(process.env.ENSRAINBOW_API_URL || DEFAULT_ENSRAINBOW_API_URL),
);
