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
 * Interprets a Literal Label into an Interpreted Label.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-label
 * @see https://ensnode.io/docs/reference/terminology#interpreted-label
 *
 * @param label - The Literal Label string to validate
 * @returns An Interpreted Label
 */
export function interpretLiteralLabel(label: Label): Label | EncodedLabelHash {
  // if the label normalized, we're all good
  if (isNormalizedLabel(label)) return label;

  // otherwise, represent as encoded LabelHash
  return encodeLabelHash(labelhash(label));
}

/**
 * Interprets a Literal Name value into an Interpreted Name or null, if the Literal Name is null or
 * composed of un-interpretable Labels.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-name
 * @see https://ensnode.io/docs/reference/terminology#interpreted-name
 *
 * @param name - The ENS name string to validate
 * @returns An Interpreted Name that is either normalized or consists entirely of Interpreted Labels
 */
export function interpretLiteralName(name: Name): Name {
  // if the name is already normalized (includes empty string), good to go
  if (isNormalizedName(name)) return name;

  // otherwise ensure the name is composed of Interpreted Labels
  return name.split(".").map(interpretLiteralLabel).join(".");
}

/**
 * Interprets the provided name record value, ensuring that it is either:
 * a) null, or
 * b) a normalized, non-empty-string Name.
 *
 * @param value - The name record value string to validate
 * @returns A valid normalized Name for use as a name record, or null if invalid (empty string or not normalized)
 */
export function interpretNameRecordValue(value: string): Name | null {
  // empty string is technically a normalized name, representing the ens root node, but in the
  // context of a name record value, we want to coerce empty string to null, to represent the
  // non-existence of a record value. this is because the abi of this event is only capable of
  // expressing string values, so empty string canonically represents the non-existence of the
  // record value.
  if (value === "") return null;

  // if not normalized, is not valid `name` record value
  if (!isNormalizedName(value)) return null;

  // otherwise, this is a non-empty-string normalized Name that can be used as a name() record value
  return value as Name;
}
