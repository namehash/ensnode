import { ens_beautify } from "@adraffy/ens-normalize";

import { ENS_ROOT_NAME } from "./constants";
import { interpretedNameToInterpretedLabels } from "./interpreted-names-and-labels";
import { isEncodedLabelHash } from "./labelhash";
import type { BeautifiedName, InterpretedName } from "./types";

/**
 * Converts an {@link InterpretedName} into a {@link BeautifiedName} suitable for presentation in a UI.
 *
 * Each label of the InterpretedName is either an Encoded LabelHash or a normalized Label:
 * - Encoded LabelHash labels are preserved verbatim.
 * - Normalized Labels are passed through {@link ens_beautify}, producing a Label that is
 *   normalizable (and normalizes back to the input) but may itself be unnormalized.
 *
 * The resulting BeautifiedName is suitable for display but is NOT an InterpretedName, and the
 * branded return type prevents it from being passed to APIs that expect one. Continue to use the
 * source InterpretedName for navigation targets, lookup keys, and anywhere else that expects an
 * InterpretedName.
 *
 * @example
 * ```ts
 * beautifyInterpretedName("♾♾♾♾.eth" as InterpretedName) // → "♾️♾️♾️♾️.eth"
 * ```
 */
export const beautifyInterpretedName = (name: InterpretedName): BeautifiedName => {
  if (name === ENS_ROOT_NAME) return name as string as BeautifiedName;

  return interpretedNameToInterpretedLabels(name)
    .map((label) => (isEncodedLabelHash(label) ? label : ens_beautify(label)))
    .join(".") as BeautifiedName;
};
