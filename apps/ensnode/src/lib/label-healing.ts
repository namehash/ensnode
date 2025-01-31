import { isUnknownLabel, unknownLabelAsHex } from "ensnode-utils/subname-helpers";

interface LabelHealing {
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
 * A no-op implementation of `LabelHealing` that does nothing.
 * Useful when no valid ENSRainbow API URL is provided.
 */
const labelHealingNoOp: LabelHealing = Object.freeze({
  async heal() {
    return null;
  },
});

/**
 * A factory function to
 * @param ensRainbowBaseUrl
 * @returns
 */
function createLabelHealing(ensRainbowBaseUrl: string | undefined): LabelHealing {
  try {
    if (!ensRainbowBaseUrl) {
      console.warn("LabelHealing: no ENSRainbow API URL was provided.");
      return labelHealingNoOp;
    }

    const ensRainbowBaseUrlParsed = new URL(ensRainbowBaseUrl);

    /**
     * Fetches the healed label for the given unknown label.
     * @param label any label
     * @returns healed label if available
     */
    async function fetchHealedLabel(label: string) {
      try {
        // first, let's make sure this is an encoded unknown label
        if (!isUnknownLabel(label)) {
          return null;
        }

        const response = await fetch(
          new URL(`/v1/heal/${unknownLabelAsHex(label)}`, ensRainbowBaseUrlParsed).toString(),
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
    };
  } catch (error: any) {
    console.error(`LabelHealing: failed to created instance. ${error.message}`);
    return labelHealingNoOp;
  }
}

export const labelHealing = createLabelHealing(process.env.ENSRAINBOW_API_BASE_URL);
