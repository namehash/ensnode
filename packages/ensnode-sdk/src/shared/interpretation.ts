import { labelhash } from "viem";

import {
  type EncodedLabelHash,
  type Label,
  type Name,
  encodeLabelHash,
  isNormalizedLabel,
  isNormalizedName,
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

  // otherwise, interpret as EncodedLabelHash
  return encodeLabelHash(labelhash(label));
}

/**
 * Transforms a Literal Name into an Interpreted Name.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-name
 * @see https://ensnode.io/docs/reference/terminology#interpreted-name
 *
 * @param name - The Literal Name string to interpret
 * @returns The provided name if it is normalized, else converts each label in name that is not a
 * normalized label into an Interpreted Label
 */
export function interpretLiteralName(name: Name): Name {
  // if the name is already normalized (includes empty string), good to go
  if (isNormalizedName(name)) return name;

  // otherwise ensure the name is composed of Interpreted Labels
  return name.split(".").map(interpretLiteralLabel).join(".");
}
