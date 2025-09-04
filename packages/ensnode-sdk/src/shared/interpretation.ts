import { labelhash } from "viem";

import {
  type InterpretedLabel,
  InterpretedName,
  type LiteralLabel,
  LiteralName,
  encodeLabelHash,
  isNormalizedLabel,
} from "../ens";

/**
 * Transforms a Literal Label into an Interpreted Label.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-label
 * @see https://ensnode.io/docs/reference/terminology#interpreted-label
 *
 * @param label - The Literal Label string to interpret
 * @returns The provided label if it is normalized, else the EncodedLabelHash of the label
 */
export function interpretLiteralLabel(label: LiteralLabel): InterpretedLabel {
  // if the label is normalized, good to go
  if (isNormalizedLabel(label)) return label as string as InterpretedLabel;

  // otherwise (includes empty string label), interpret as EncodedLabelHash
  return encodeLabelHash(labelhash(label)) as InterpretedLabel;
}

/**
 * Interprets an ordered list of Literal Labels into an Interpreted Name.
 *
 * Note that it's important that the Literal Labels are provided as an array, otherwise it's
 * impossible to differentiate between 'a.label.eth' being ['a.label', 'eth'] or ['a', 'label', 'eth'].
 *
 * Note that the input is an ordered list of _Literal_ Labels: in this context, any literal label
 * that is formatted as an Encoded LabelHash will NOT be interpreted as such. Instead it will be
 * interpreted into an Encoded LabelHash that encodes the literal labelhash of the Literal Label.
 *
 * @param labels An ordered list of Literal Labels
 * @returns An InterpretedName
 */
export function literalLabelsToInterpretedName(labels: LiteralLabel[]): InterpretedName {
  return labels.map(interpretLiteralLabel).join(".") as InterpretedName;
}

/**
 * Joins the list of Interpreted Labels with '.' to form an Interpreted Name.
 *
 * @param labels An ordered list of Interpreted Labels
 * @returns An InterpretedName
 */
export function interpretedLabelsToInterpretedName(labels: InterpretedLabel[]): InterpretedName {
  return labels.join(".") as InterpretedName;
}

/**
 * Joins the list of Literal Labels with '.' to form a Literal Name.
 *
 * @param labels An ordered list of Literal Labels
 * @returns An LiteralName
 */
export function literalLabelsToLiteralName(labels: LiteralLabel[]): LiteralName {
  return labels.join(".") as LiteralName;
}
