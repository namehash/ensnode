import { RainbowRecord } from "@/utils/rainbow-record";
import { ByteArray } from "viem";
import { once } from "events";
import { promises as fs, createReadStream, createWriteStream } from "fs";
import { Readable } from "stream";

/**
 * Standalone Binary serializer that encodes records in a simple binary format:
 * - 32 bytes: labelhash
 * - 4 bytes: UInt32BE for the length of the label
 * - variable bytes: UTF-8 encoded label
 * 
 * Records are written sequentially without additional complexity.
 */
export class BinarySerializer {
  protected filePath: string;
  protected writeStream: NodeJS.WritableStream | null = null;
  protected readStream: Readable | null = null;
  protected remainingBuffer: Buffer | null = null;

  constructor(outputFilePath: string) {
    this.filePath = outputFilePath;
  }

  /**
   * Opens a write stream to the output file
   */
  async openForWriting(): Promise<void> {
    this.writeStream = createWriteStream(this.filePath);
    await once(this.writeStream, "open");
  }

  /**
   * Opens a read stream from the input file
   */
  async openForReading(): Promise<void> {
    this.readStream = createReadStream(this.filePath);
    await once(this.readStream, "open");
    this.remainingBuffer = Buffer.alloc(0);
  }

  /**
   * Closes any open streams
   */
  async close(): Promise<void> {
    if (this.writeStream) {
      this.writeStream.end();
      await once(this.writeStream, "close");
      this.writeStream = null;
    }

    if (this.readStream) {
      this.readStream.destroy();
      this.readStream = null;
    }

    this.remainingBuffer = null;
  }

  async writeRecord(record: RainbowRecord): Promise<void> {
    // Validate labelHash is not empty and is 32 bytes
    if (!record.labelHash || record.labelHash.length !== 32) {
      throw new Error(`Invalid labelHash: expected 32 bytes, got ${record.labelHash?.length ?? 0}`);
    }

    try {
      // Ensure write stream is open
      if (!this.writeStream) {
        await this.openForWriting();
      }

      // At this point, writeStream should be initialized
      if (!this.writeStream) {
        throw new Error("Failed to open write stream");
      }

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

      // Write directly to the stream
      const isOk = this.writeStream.write(buffer);
      if (!isOk) {
        // Wait for drain event if the buffer is full
        await once(this.writeStream, "drain");
      }
    } catch (error) {
      console.error("Error during binary serialization:", error);
      throw error;
    }
  }

  async readRecord(): Promise<RainbowRecord | null> {
    try {
      // Ensure read stream is open
      if (!this.readStream) {
        await this.openForReading();
      }

      // First ensure we have a read stream and a remaining buffer
      if (!this.readStream || this.remainingBuffer === null) {
        return null;
      }

      // We need at least 36 bytes to read the labelHash (32 bytes) and the label length (4 bytes)
      const MIN_HEADER_SIZE = 36;
      
      // Read more data if needed for header
      while (this.remainingBuffer.length < MIN_HEADER_SIZE) {
        try {
          const [chunk] = await once(this.readStream, "data");
          if (!chunk) {
            return null; // End of file
          }
          this.remainingBuffer = Buffer.concat([this.remainingBuffer, chunk]);
        } catch (error) {
          // Stream ended or errored
          if (this.remainingBuffer.length === 0) {
            return null;
          }
          break;
        }
      }

      // If we still don't have enough for the header, we're at EOF
      if (this.remainingBuffer.length < MIN_HEADER_SIZE) {
        return null;
      }

      // Extract the labelHash (first 32 bytes)
      const labelHash = this.remainingBuffer.slice(0, 32);

      // Extract the label length (next 4 bytes)
      const labelLength = this.remainingBuffer.readUInt32BE(32);
      const totalRecordLength = MIN_HEADER_SIZE + labelLength;

      // Ensure we have enough data for the full record
      while (this.remainingBuffer.length < totalRecordLength) {
        try {
          const [chunk] = await once(this.readStream, "data");
          if (!chunk) {
            return null; // End of file
          }
          this.remainingBuffer = Buffer.concat([this.remainingBuffer, chunk]);
        } catch (error) {
          // Stream ended or errored
          return null;
        }
      }

      // Extract the label (remaining bytes after the header)
      const label = this.remainingBuffer.slice(36, totalRecordLength).toString("utf8");

      // Update the remaining buffer
      this.remainingBuffer = this.remainingBuffer.slice(totalRecordLength);

      // Return the record
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
