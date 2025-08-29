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

  // otherwise (includes empty string label), interpret as EncodedLabelHash
  return encodeLabelHash(labelhash(label));
}

/**
 * Requires that the provided Literal Name is an Interpreted Name.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-name
 * @see https://ensnode.io/docs/reference/terminology#interpreted-name
 *
 * @param name - The Literal Name to interpret
 * @returns An Interpreted Name
 * @throws If the Literal Name is not normalized
 */
export function requireInterpretedName(name: Name) {
  // if the name is already normalized (includes empty string), good to go
  if (isNormalizedName(name)) return name;

  throw new Error(
    `Invariant(requireInterpretedName): The provided name '${name}' is not normalized and cannot be an Interpreted Name.`,
  );
}
