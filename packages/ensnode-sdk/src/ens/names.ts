import { ens_beautify } from "@adraffy/ens-normalize";

import { isNormalizedLabel } from "./is-normalized";
import type { Label, Name, NormalizedName } from "./types";

/**
 * Constructs a name hierarchy from a given NormalizedName.
 *
 * @example
 * ```
 * getNameHierarchy("sub.example.eth") -> ["sub.example.eth", "example.eth", "eth"]
 * ```
 *
 * @dev by restricting the input type to NormalizedName we guarantee that we can split and join
 * on '.' and receive NormalizedNames as a result
 */
export const getNameHierarchy = (name: NormalizedName): NormalizedName[] =>
  name.split(".").map((_, i, labels) => labels.slice(i).join(".")) as NormalizedName[];

/**
 * Get FQDN of parent for a name.
 */
export const getParentNameFQDN = (name: Name): Name =>
  // Strip off the child-most label in the name to get the FQDN of the parent
  name
    .split(".")
    .slice(1)
    .join(".");

/**
 * Beautifies a name by converting each normalized label in the provided name to
 * its "beautified" form. Labels that are not normalized retain their original value.
 *
 * Invariants:
 * - The number of labels in the returned name is the same as the number of labels in the input name.
 * - The order of the labels in the returned name is the same as the order of the labels in the input name.
 * - If a label in the input is normalized, it is returned in its "beautified" form.
 * - If a label in the input name is not normalized, it is returned without modification.
 * - Therefore, the result of ens_normalize(beautifyName(name)) is the same as the result of ens_normalize(name).
 *
 * The "beautified form" of a normalized label converts special sequences of
 * emojis and other special characters to their "beautified" equivalents. All
 * such conversions transform X -> Y where Y is normalizable and normalizes back to X.
 * Ex: '1⃣2⃣' (normalized) to '1️⃣2️⃣' (normalizable but not normalized).
 * Ex: 'ξethereum' (normalized) to 'Ξethereum' (normalizable, but not normalized).
 * Ex: 'abc' (normalized) to 'abc' (also normalized, no conversion).
 * Ex: 'ABC' (normalizable but not normalized) to 'ABC' (no conversion).
 * Ex: 'invalid|label' (not normalizable) to 'invalid|label' (no conversion).
 * Ex: '' (unnormalized as a label) to '' (no conversion).
 *
 * @param name - The name to beautify.
 * @returns The beautified name.
 */
export const beautifyName = (name: Name): Name => {
  const beautifiedLabels = name.split(".").map((label: Label) => {
    if (isNormalizedLabel(label)) {
      return ens_beautify(label);
    } else {
      return label;
    }
  });
  return beautifiedLabels.join(".");
};
