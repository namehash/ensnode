import { normalize } from "viem/ens";

import {
  encodedLabelToLabelhash,
  encodeLabelHash,
  type InterpretedName,
  type LiteralLabel,
  labelhashLiteralLabel,
  type Name,
  type NormalizedName,
} from "@ensnode/ensnode-sdk";

export const NameInterpretationOutcomeResult = {
  /** The input was empty (or whitespace-only). */
  Empty: "Empty",
  /** All labels were normalized successfully.*/
  Normalized: "Normalized",
  /** One or moer labels were already formatted as encoded labelhashes. None were unnormalizable. */
  Reencoded: "Reencoded",
  /** One or more labels were unnormalizable and were encoded as labelhashes. */
  Encoded: "Encoded",
} as const;

export type NameInterpretationOutcomeResult =
  (typeof NameInterpretationOutcomeResult)[keyof typeof NameInterpretationOutcomeResult];

export interface NameInterpretationOutcomeEmpty {
  outcome: typeof NameInterpretationOutcomeResult.Empty;
  inputName: Name;
  interpretation: InterpretedName;
}

export interface NameInterpretationOutcomeNormalized {
  outcome: typeof NameInterpretationOutcomeResult.Normalized;
  inputName: Name;
  interpretation: NormalizedName;
}

export interface NameInterpretationOutcomeReencoded {
  outcome: typeof NameInterpretationOutcomeResult.Reencoded;
  inputName: Name;
  interpretation: InterpretedName;
}

export interface NameInterpretationOutcomeEncoded {
  outcome: typeof NameInterpretationOutcomeResult.Encoded;
  inputName: Name;
  hadEmptyLabels: boolean;
  interpretation: InterpretedName;
}

export type NameInterpretationOutcome =
  | NameInterpretationOutcomeEmpty
  | NameInterpretationOutcomeNormalized
  | NameInterpretationOutcomeReencoded
  | NameInterpretationOutcomeEncoded;

export function interpretNameFromUserInput(inputName: Name): NameInterpretationOutcome {
  if (inputName.trim() === "") {
    return {
      outcome: NameInterpretationOutcomeResult.Empty,
      inputName,
      interpretation: "" as InterpretedName,
    };
  }

  let hadEmptyLabels = false;
  let hadReencodedLabels = false;
  let hadUnnormalizableLabels = false;

  const interpretedLabels = inputName.split(".").map((label) => {
    if (label === "") {
      hadEmptyLabels = true;
      hadUnnormalizableLabels = true;
      return encodeLabelHash(labelhashLiteralLabel(label as LiteralLabel));
    }

    try {
      return normalize(label);
    } catch {
      if (encodedLabelToLabelhash(label) !== null) {
        hadReencodedLabels = true;
        return label.toLowerCase();
      } else {
        hadUnnormalizableLabels = true;
        return encodeLabelHash(labelhashLiteralLabel(label as LiteralLabel));
      }
    }
  });

  const interpretation = interpretedLabels.join(".");

  if (hadUnnormalizableLabels) {
    return {
      outcome: NameInterpretationOutcomeResult.Encoded,
      inputName,
      hadEmptyLabels,
      interpretation: interpretation as InterpretedName,
    };
  } else if (hadReencodedLabels) {
    return {
      outcome: NameInterpretationOutcomeResult.Reencoded,
      inputName,
      interpretation: interpretation as InterpretedName,
    };
  } else {
    return {
      outcome: NameInterpretationOutcomeResult.Normalized,
      inputName,
      interpretation: interpretation as NormalizedName,
    };
  }
}
