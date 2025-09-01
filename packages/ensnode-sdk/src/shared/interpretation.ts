import { labelhash } from "viem";

import {
  type EncodedLabelHash,
  type Label,
  type Name,
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
export function interpretLiteralLabel(label: Label): Label | EncodedLabelHash {
  // if the label is normalized, good to go
  if (isNormalizedLabel(label)) return label;

  // otherwise (includes empty string label), interpret as EncodedLabelHash
  return encodeLabelHash(labelhash(label));
}

/**
 * Interprets a set of Literal Labels into an Interpreted Name.
 *
 * Note that it's important that the Literal Labels are provided as an array, otherwise it's
 * impossible to differentiate between 'a.label.eth' being ['a.label', 'eth'] or ['a', 'label', 'eth'].
 *
 * Note that the input is a set of _Literal_ Labels: in this context, any label that looks like an
 * Encoded LabelHash will NOT be interpreted as such, and _its_ labelhash will be used.
 *
 * @param labels A set of Literal Labels
 * @returns An Interpreted Name
 */
export function interpretLiteralLabelsIntoInterpretedName(labels: Label[]): Name {
  return labels.map(interpretLiteralLabel).join(".");
}
