import { isHex } from "viem";

import type { LabelHash } from "./types";

/**
 * Checks if the input is a {@link LabelHash}.
 *
 * @see https://ensnode.io/docs/reference/terminology#label-processing-and-classification
 */
export function isLabelHash(maybeLabelHash: string): maybeLabelHash is LabelHash {
  const expectedLength = maybeLabelHash.length === 66;
  const expectedEncoding = isHex(maybeLabelHash);
  const expectedCasing = maybeLabelHash === maybeLabelHash.toLowerCase();

  return expectedLength && expectedEncoding && expectedCasing;
}
