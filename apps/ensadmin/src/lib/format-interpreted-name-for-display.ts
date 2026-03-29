import {
  beautifyName,
  type InterpretedName,
  isNormalizedLabel,
  type Label,
  type Name,
} from "@ensnode/ensnode-sdk";

/**
 * Formats an InterpretedName for display in UI strings.
 *
 * - Normalized labels are beautified (via ens_beautify).
 * - Encoded labelhash labels are lowercased for consistent display.
 *
 * NOTE: This function only takes an InterpretedName, not a raw Name.
 * The return type is Name (not InterpretedName) because beautification
 * may produce labels that are not normalized.
 *
 * @see https://github.com/namehash/ensnode/pull/1125#discussion_r2387030360
 */
export function formatInterpretedNameForDisplay(name: InterpretedName): Name {
  // beautifyName handles the ens_beautify step for normalized labels.
  // We then lowercase any non-normalized labels (encoded labelhashes).
  const beautified = beautifyName(name);

  const displayLabels = beautified.split(".").map((label: Label) => {
    if (isNormalizedLabel(label)) {
      return label;
    } else {
      return label.toLowerCase();
    }
  });

  return displayLabels.join(".");
}
