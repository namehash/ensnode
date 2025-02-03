import { ByteArray, labelhash } from 'viem';
import { Labelhash } from '../../../../packages/ensnode-utils/src/types';
import { labelHashToBytes } from './label-utils';
import { byteArraysEqual } from './byte-utils';

export interface RainbowRecord {
  labelHash: ByteArray;
  label: string;
}

export interface RainbowRecordOptions {
  /**
   * Whether to validate that the provided labelhash matches the computed labelhash of the label.
   * This is useful for validating the integrity of the rainbow table data.
   * @default false
   */
  validateLabelHash?: boolean;
}

/**
 * Parses a line from the rainbow table SQL dump into a RainbowRecord.
 * 
 * @param line A line from the rainbow table SQL dump in the format "labelhash\tlabel"
 * @param options Optional configuration for parsing behavior
 * @returns A RainbowRecord containing the parsed labelhash and label
 * @throws Error if the line format is invalid or if validation fails
 */
export function buildRainbowRecord(line: string, options: RainbowRecordOptions = {}): RainbowRecord {
  const parts = line.trim().split("\t");
  if (parts.length !== 2) {
    throw new Error(`Invalid line format - expected 2 columns but got ${parts.length}: "${line.slice(0, 100)}"`);
  }

  const [maybeLabelHash, label] = parts;
  const labelHash = labelHashToBytes(maybeLabelHash as Labelhash);

  if (options.validateLabelHash) {
    const computedLabelHash = labelHashToBytes(labelhash(label) as Labelhash);

    if (!byteArraysEqual(labelHash, computedLabelHash)) {
        throw new Error(`Labelhash validation failed: computed hash does not match provided hash`);
     }
  }

  return {
    labelHash,
    label
  };
} 
