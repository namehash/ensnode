import msgpack from "msgpack-lite";
import { ByteArray } from "viem";
import { once } from "events";
import { promises as fs, createReadStream, createWriteStream } from "fs";
import { Readable } from "stream";

import { RainbowRecord } from "@/utils/rainbow-record";

/**
 * Standalone MsgPack serializer that encodes records directly in msgpack format.
 * Records are written sequentially without length prefixing.
 */
export class MsgPackSerializer {
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

  /**
   * Writes a record to the output file
   */
  async writeRecord(record: RainbowRecord): Promise<void> {
    try {
      // Ensure write stream is open
      if (!this.writeStream) {
        await this.openForWriting();
      }

      // Encode the record with msgpack
      const encoded = msgpack.encode({
        labelHash: Array.from(record.labelHash),
        label: record.label,
      });

      // Write directly to the stream without length prefixing
      const isOk = this.writeStream!.write(encoded);
      if (!isOk) {
        // Wait for drain event if the buffer is full
        await once(this.writeStream!, "drain");
      }
    } catch (error) {
      console.error("Error during msgpack serialization:", error);
      throw error;
    }
  }

  /**
   * Reads a record from the input file
   * Returns null when there are no more records
   */
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

      // Process data only if there's anything in the buffer
      if (this.remainingBuffer.length === 0) {
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

      // Instead of trying to use msgpack.decode.bytes, we'll use a try-catch approach
      // to determine if we have enough data in the buffer
      try {
        // Try to decode the message
        const decoded = msgpack.decode(this.remainingBuffer);
        
        // If decoding succeeds, we have at least one complete message
        // But we don't know how many bytes were consumed, so we need to re-encode
        // to determine the message size
        const reEncoded = msgpack.encode(decoded);
        const consumedBytes = reEncoded.length;
        
        // Update the remaining buffer, removing the consumed bytes
        this.remainingBuffer = this.remainingBuffer.slice(consumedBytes);
        
        return {
          labelHash: new Uint8Array(decoded.labelHash) as ByteArray,
          label: decoded.label,
        };
      } catch (error) {
        // If we get an error, we may need more data
        if (error instanceof Error && (error.message.includes("Unexpected") || 
                                       error.message.includes("Invalid") ||
                                       error.message.includes("EOS"))) {
          try {
            const [chunk] = await once(this.readStream, "data");
            if (!chunk) {
              return null; // End of file
            }
            this.remainingBuffer = Buffer.concat([this.remainingBuffer, chunk]);
            // Try again with the new data
            return this.readRecord();
          } catch (error) {
            // Stream ended or errored
            return null;
          }
        }
        
        // If it's EOF or another error, return null
        if (error instanceof Error && error.message.includes("EOF")) {
          return null;
        }
        
        throw error;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("EOF")) {
        return null;
      }
      console.error("Error in readRecord:", error);
      throw error;
    }
  }
}
