import { ens_beautify } from "@adraffy/ens-normalize";

import { ENS_ROOT_NAME } from "./constants";
import {
  interpretedLabelsToInterpretedName,
  interpretedNameToInterpretedLabels,
} from "./interpreted-names-and-labels";
import { isNormalizedLabel } from "./normalization";
import type { InterpretedLabel, InterpretedName, Label, Name } from "./types";

/**
 * Constructs a name hierarchy from a given InterpretedName.
 *
 * @example
 * ```
 * getNameHierarchy("sub.example.eth") -> ["sub.example.eth", "example.eth", "eth"]
 * ```
 */
export const getNameHierarchy = (name: InterpretedName): InterpretedName[] => {
  if (name === ENS_ROOT_NAME) return [];

  return interpretedNameToInterpretedLabels(name).map((_, i, labels) =>
    interpretedLabelsToInterpretedName(labels.slice(i)),
  );
};

/**
 * Derives the parent's {@link InterpretedName} of the provided `name`, or null if there is none.
 */
export const getParentInterpretedName = (name: InterpretedName): InterpretedName | null => {
  if (name === ENS_ROOT_NAME) return null;

  const labels = interpretedNameToInterpretedLabels(name);

  // For TLDs, return ENS_ROOT_NAME
  if (labels.length === 1) return ENS_ROOT_NAME;

  // Strip off the child-most label in the name to get the FQDN of the parent
  return interpretedLabelsToInterpretedName(labels.slice(1));
};

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
export const beautifyName = (name: Name): Name =>
  name
    .split(".")
    .map((label: Label) => {
      if (isNormalizedLabel(label)) {
        return ens_beautify(label);
      } else {
        return label;
      }
    })
    .join(".");

/**
 * Formats an InterpretedName for display in UI strings.
 *
 * - Normalized labels are beautified (via ens_beautify).
 * - Non-normalized labels (encoded labelhashes) are lowercased for consistent display.
 *
 * NOTE: This function only takes an InterpretedName, not a raw Name.
 * The return type is Name (not InterpretedName) because beautification
 * may produce labels that are not normalized.
 *
 * @param name - The InterpretedName to format for display.
 */
export const formatInterpretedNameForDisplay = (name: InterpretedName): Name =>
  interpretedNameToInterpretedLabels(name)
    .map((label: InterpretedLabel) => {
      if (isNormalizedLabel(label)) {
        return ens_beautify(label);
      } else {
        return label.toLowerCase();
      }
    })
    .join(".");
