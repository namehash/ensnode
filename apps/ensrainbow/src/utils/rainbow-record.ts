import type { LabelHash } from "@ensnode/ensnode-sdk";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk";
import { ByteArray } from "viem";

export interface RainbowRecord {
  labelHash: ByteArray;
  label: string;
}

/**
 * Parses a line from the rainbow table SQL dump into a RainbowRecord.
 *
 * @param line A line from the rainbow table SQL dump in the format "labelHash\tlabel"
 * @returns A RainbowRecord containing the parsed labelHash and label
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
  const labelHash = labelHashToBytes(maybeLabelHash as LabelHash);

  return { labelHash, label };
}
