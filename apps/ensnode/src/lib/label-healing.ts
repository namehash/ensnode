import { isUnknownLabel, unknownLabelAsHex } from "ensnode-utils/subname-helpers";

interface LabelHealing {
  heal<Label extends string, Name extends string | null>(
    label: Label,
    name: Name,
  ): Promise<[Label, Name] | null>;
}

const labelHealingNoOp: LabelHealing = Object.freeze({
  async heal() {
    return null;
  },
});

function createLabelHealing(ensRainbowBaseUrl: string | undefined): LabelHealing {
  try {
    if (!ensRainbowBaseUrl) {
      console.warn("LabelHealing: no ENSRainbow API URL was provided.");
      return labelHealingNoOp;
    }

    const ensRainbowBaseUrlParsed = new URL(ensRainbowBaseUrl);

    async function fetchHealedLabel(label: string) {
      try {
        if (!isUnknownLabel(label)) {
          return null;
        }

        const labelHex = unknownLabelAsHex(label);

        const response = await fetch(
          new URL(`/v1/heal/${labelHex}`, ensRainbowBaseUrlParsed).toString(),
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
        console.log("Healing label", label);
        const healedLabel = await fetchHealedLabel(label);

        if (!healedLabel) {
          return null;
        }

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
