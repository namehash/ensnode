import { labelHashToBytes } from "@ensnode/ensrainbow-sdk";
import type { Labelhash } from "@ensnode/utils";
import { ByteArray } from "viem";

export interface RainbowRecord {
  labelHash: ByteArray;
  label: string;
}

/**
 * Parses a line from the rainbow table SQL dump into a RainbowRecord.
 *
 * @param line A line from the rainbow table SQL dump in the format "labelhash\tlabel"
 * @returns A RainbowRecord containing the parsed labelhash and label
 * @throws Error if the line format is invalid
 */
export function buildRainbowRecord(line: string): RainbowRecord {
  const parts = line.trim().split("\t");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid line format - expected 2 columns but got ${parts.length}: "${line.slice(0, 100)}"`,
    );
  }

  const [maybeLabelHash, label] = parts;
  const labelHash = labelHashToBytes(maybeLabelHash as Labelhash);

  return {
    labelHash,
    label,
  };
}
