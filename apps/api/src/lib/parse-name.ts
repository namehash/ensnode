import { LabelHash } from "@ensnode/utils/types";
import { Hex, isHex } from "viem";
import { labelhash, normalize } from "viem/ens";

// https://github.com/wevm/viem/blob/main/src/utils/ens/encodedLabelToLabelhash.ts
export function encodedLabelToLabelhash(label: string): Hex | null {
  if (label.length !== 66) return null;
  if (label.indexOf("[") !== 0) return null;
  if (label.indexOf("]") !== 65) return null;
  const hash = `0x${label.slice(1, 65)}`;
  if (!isHex(hash)) return null;
  return hash;
}

/**
 * parses a name into labelHash segments. name may contain encoded labelHashes
 */
export function parseName(name: string): LabelHash[] {
  if (name !== normalize(name)) throw new Error(`parseName: "${name}" is not normalized.`);

  return name.split(".").map((segment) => {
    const labelHash = segment.startsWith("[")
      ? encodedLabelToLabelhash(segment)
      : labelhash(segment);

    if (!labelHash) {
      throw new Error(
        `parseName: name "${name}" segment "${segment}" is not a valid encoded labelHash`,
      );
    }

    return labelHash;
  });
}
