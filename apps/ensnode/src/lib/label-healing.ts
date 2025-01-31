import { isUnknownLabel, unknownLabelAsHex } from "ensnode-utils/subname-helpers";

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
function createLabelHealing(ensRainbowApiUrl: string | undefined): ENSRainbow {
  /**
   * Fetches the healed label for the given unknown label.
   * @param label any label
   * @returns healed label if available
   */
  async function fetchHealedLabel(label: string) {
    try {
      const ensRainbowApiUrlParsed = ensRainbowApiUrl ? new URL(ensRainbowApiUrl) : null;

      // If the ENSRainbow API URL is not provided, we can't heal the label
      if (!ensRainbowApiUrlParsed) {
        console.warn("LabelHealing: no ENSRainbow API URL was provided.");
        return null;
      }

      // first, let's make sure this is an encoded unknown label
      if (!isUnknownLabel(label)) {
        return null;
      }

      const response = await fetch(
        new URL(`/v1/heal/${unknownLabelAsHex(label)}`, ensRainbowApiUrlParsed).toString(),
      );

      if (!response.ok) {
        console.error("Failed to heal label", label, response.statusText);
        return null;
      }

      return response.text();
    } catch (error) {
      console.error("Failed to heal label", label, error);
      return null;
    }
  }

  return {
    async heal(label, name) {
      const healedLabel = await fetchHealedLabel(label);

      if (!healedLabel) {
        return null;
      }

      // If the name is provided, try to heal it as well
      const healedName = name ? name.replaceAll(label, healedLabel) : null;

      return [healedLabel, healedName] as [typeof label, typeof name];
    },
  } satisfies ENSRainbow;
}

export const labelHealing = createLabelHealing(process.env.ENSRAINBOW_API_URL);
