import { isHex } from "viem";
import { labelhash } from "viem/ens";

import {
  encodeLabelHash,
  type InterpretedLabel,
  type InterpretedName,
  isNormalizedLabel,
  type Label,
  type LabelHash,
  type LabelPath,
  type LiteralLabel,
  type LiteralName,
  type Name,
} from "../ens";
import { labelhashLiteralLabel } from "./labelhash";

/**
 * Interprets a Literal Label, producing an Interpreted Label.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-label
 * @see https://ensnode.io/docs/reference/terminology#interpreted-label
 *
 * @param label - The Literal Label string to interpret
 * @returns The provided label if it is a normalized label, else the EncodedLabelHash of the label
 */
export function literalLabelToInterpretedLabel(label: LiteralLabel): InterpretedLabel {
  // if the label is normalized, good to go
  if (isNormalizedLabel(label)) return label as Label as InterpretedLabel;

  // otherwise, encode the labelhash of the literal Label
  return encodeLabelHash(labelhashLiteralLabel(label)) as InterpretedLabel;
}

/**
 * Interprets an ordered list of Literal Labels, producing an Interpreted Name.
 *
 * Note that it's important that the Literal Labels are provided as an array, otherwise it's
 * impossible to differentiate between 'a.label.eth' being ['a.label', 'eth'] or ['a', 'label', 'eth'].
 *
 * Note that the input is an ordered list of _Literal_ Labels: in this context, any literal label
 * that is formatted as an Encoded LabelHash will NOT be interpreted as such. Instead it will be
 * interpreted into an Encoded LabelHash that encodes the literal labelhash of the Literal Label.
 *
 * @param labels An ordered list of 0 or more Literal Labels
 * @returns An InterpretedName
 */
export function literalLabelsToInterpretedName(labels: LiteralLabel[]): InterpretedName {
  return labels.map(literalLabelToInterpretedLabel).join(".") as InterpretedName;
}

/**
 * Joins the list of Interpreted Labels with '.' to form an Interpreted Name.
 *
 * @param labels An ordered list of 0 or more Interpreted Labels
 * @returns An InterpretedName
 */
export function interpretedLabelsToInterpretedName(labels: InterpretedLabel[]): InterpretedName {
  return labels.join(".") as InterpretedName;
}

/**
 * Joins the list of Literal Labels with '.' to form a Literal Name.
 *
 * Note: LiteralLabel values may contain '.' characters, which will be preserved
 * in the resulting LiteralName. Therefore, the number of labels in the returned
 * LiteralName may be greater than the number of LiteralLabels in the input array.
 *
 * @param labels An ordered list of 0 or more Literal Labels
 * @returns An LiteralName
 */
export function literalLabelsToLiteralName(labels: LiteralLabel[]): LiteralName {
  return labels.join(".") as LiteralName;
}

/**
 * Converts an Interpreted Name into a list of Interpreted Labels.
 */
export function interpretedNameToInterpretedLabels(name: InterpretedName): InterpretedLabel[] {
  return name.split(".") as InterpretedLabel[];
}

// https://github.com/wevm/viem/blob/main/src/utils/ens/encodedLabelToLabelhash.ts
export function encodedLabelToLabelhash(label: string): LabelHash | null {
  if (label.length !== 66) return null;
  if (label.indexOf("[") !== 0) return null;
  if (label.indexOf("]") !== 65) return null;
  const hash = `0x${label.slice(1, 65)}`;
  if (!isHex(hash)) return null;
  return hash;
}

export function isInterpetedLabel(label: Label): label is InterpretedLabel {
  // if it looks like an encoded labelhash, it must be one
  if (label.startsWith("[")) {
    const labelHash = encodedLabelToLabelhash(label);
    if (labelHash === null) return false;
  }

  // otherwise label must be normalized
  return isNormalizedLabel(label);
}

export function isInterpretedName(name: Name): name is InterpretedName {
  return name.split(".").every(isInterpetedLabel);
}

/**
 * Converts an InterpretedName into a LabelPath.
 */
export function interpretedNameToLabelPath(name: InterpretedName): LabelPath {
  return interpretedNameToInterpretedLabels(name)
    .map((label) => {
      if (!isInterpetedLabel) {
        throw new Error(
          `Invariant(interpretedNameToLabelPath): Expected InterpretedLabel, received '${label}'.`,
        );
      }

      // if it looks like an encoded labelhash, return it
      const maybeLabelHash = encodedLabelToLabelhash(label);
      if (maybeLabelHash !== null) return maybeLabelHash;

      // otherwise, labelhash it
      return labelhash(label);
    })
    .toReversed();
}
