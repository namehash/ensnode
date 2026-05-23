import { ens_beautify } from "@adraffy/ens-normalize";

import { interpretedNameToInterpretedLabels } from "./interpreted-names-and-labels";
import { isEncodedLabelHash } from "./labelhash";
import type { BeautifiedLabel, BeautifiedName, InterpretedLabel, InterpretedName } from "./types";

/**
 * Converts an {@link InterpretedLabel} into a {@link BeautifiedLabel} suitable for presentation in a UI.
 *
 * - Encoded LabelHash labels are preserved verbatim.
 * - Normalized Labels are passed through {@link ens_beautify}, producing a Label that is
 *   normalizable (and normalizes back to the input) but may itself be unnormalized.
 *
 * The resulting BeautifiedLabel is suitable for display but is NOT an InterpretedLabel, and the
 * branded return type prevents it from being passed to APIs that expect one. Continue to use the
 * source InterpretedLabel for lookup keys and anywhere else that expects an InterpretedLabel.
 *
 * @example
 * ```ts
 * beautifyInterpretedLabel("♾♾♾♾" as InterpretedLabel) // → "♾️♾️♾️♾️"
 * ```
 */
export const beautifyInterpretedLabel = (label: InterpretedLabel): BeautifiedLabel =>
  (isEncodedLabelHash(label) ? label : ens_beautify(label)) as BeautifiedLabel;

/**
 * Converts an {@link InterpretedName} into a {@link BeautifiedName} suitable for presentation in a UI
 * by beautifying each of its labels via {@link beautifyInterpretedLabel}.
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
export const beautifyInterpretedName = (name: InterpretedName): BeautifiedName =>
  interpretedNameToInterpretedLabels(name)
    .map(beautifyInterpretedLabel)
    .join(".") as BeautifiedName;
