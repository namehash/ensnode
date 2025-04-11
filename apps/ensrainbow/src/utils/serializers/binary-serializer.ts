import { RainbowRecord } from "@/utils/rainbow-record";
import { ByteArray } from "viem";
import { BaseSerializer } from "./serializer";

/**
 * Custom binary serializer that encodes records in a simple binary format:
 * - 32 bytes: labelhash
 * - 4 bytes: UInt32BE for the length of the label
 * - variable bytes: UTF-8 encoded label
 */
export class BinarySerializer extends BaseSerializer {
  constructor(outputFilePath: string) {
    super(outputFilePath);
  }

  async writeRecord(record: RainbowRecord): Promise<void> {
    // Validate labelHash is not empty and is 32 bytes
    if (!record.labelHash || record.labelHash.length !== 32) {
      throw new Error(`Invalid labelHash: expected 32 bytes, got ${record.labelHash?.length ?? 0}`);
    }

    try {
      // Convert the label to a UTF-8 encoded buffer
      const labelBuffer = Buffer.from(record.label, "utf8");

      // Create a buffer for the length of the label (4 bytes for uint32)
      const lengthBuffer = Buffer.alloc(4);
      lengthBuffer.writeUInt32BE(labelBuffer.length, 0);

      // Combine the labelHash, length, and label into a single buffer
      const buffer = Buffer.concat([
        Buffer.from(record.labelHash), // 32 bytes for the labelHash
        lengthBuffer, // 4 bytes for the label length
        labelBuffer, // Variable bytes for the UTF-8 encoded label
      ]);

      // Write the buffer to the output file
      await this.writeBuffer(buffer);
    } catch (error) {
      console.error("Error during binary serialization:", error);
      throw error;
    }
  }

  async readRecord(): Promise<RainbowRecord | null> {
    try {
      // Read the next buffer from the file
      const buffer = await this.readNextBuffer();
      if (!buffer) return null;

      // Ensure the buffer is large enough to contain the minimum required data
      // (32 bytes for labelHash + 4 bytes for length)
      if (buffer.length < 36) {
        throw new Error(`Invalid buffer length: expected at least 36 bytes, got ${buffer.length}`);
      }

      // Extract the labelHash (first 32 bytes)
      const labelHash = buffer.slice(0, 32);

      // Extract the label length (next 4 bytes)
      const labelLength = buffer.readUInt32BE(32);

      // Ensure the buffer contains the complete label
      if (buffer.length < 36 + labelLength) {
        throw new Error(`Invalid buffer: expected ${36 + labelLength} bytes, got ${buffer.length}`);
      }

      // Extract the label (remaining bytes after the length)
      const label = buffer.slice(36, 36 + labelLength).toString("utf8");

      // Return the decoded record
      return {
        labelHash: Uint8Array.from(labelHash) as ByteArray,
        label,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("EOF")) {
        return null;
      }
      console.error("Error in readRecord:", error);
      throw error;
    }
  }
}
