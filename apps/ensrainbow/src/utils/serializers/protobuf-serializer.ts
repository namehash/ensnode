import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import protobuf from "protobufjs";
import { ByteArray } from "viem";
import { once } from "events";
import { promises as fs, createReadStream, createWriteStream } from "fs";
import { Readable } from "stream";

import { RainbowRecord } from "@/utils/rainbow-record";

// In ESM modules, __dirname is not defined, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use a relative path from the current file
const protoPath = join(__dirname, "../../../protos/rainbow_record.proto");

// Global instance of the protobuf type
let RainbowRecordProto: any = null;

/**
 * Standalone Protobuf serializer that encodes records directly in protobuf format.
 * Records are written sequentially without length prefixing.
 */
export class ProtobufSerializer {
  protected filePath: string;
  protected writeStream: NodeJS.WritableStream | null = null;
  protected readStream: Readable | null = null;
  protected remainingBuffer: Buffer | null = null;

  constructor(outputFilePath: string) {
    this.filePath = outputFilePath;

    // Initialize the protobuf type if not already done
    if (!RainbowRecordProto) {
      try {
        // Read the proto file directly for debugging
        const protoContent = readFileSync(protoPath, "utf8");
        console.debug("Proto file content:", protoContent);

        // Create a new protobuf instance with the proto content
        const parsed = protobuf.parse(protoContent);
        RainbowRecordProto = parsed.root.lookupType("ensrainbow.RainbowRecord");

        if (!RainbowRecordProto) {
          throw new Error("Failed to locate RainbowRecord type in schema");
        }

        // Protobuf.js automatically converts snake_case field names to camelCase
        console.debug(
          "Loaded protobuf schema fields:",
          RainbowRecordProto.fieldsArray.map((f: any) => `${f.name} (${f.type})`),
        );
      } catch (error) {
        console.error("Failed to load protobuf schema:", error);
        console.error("Looking for file at:", protoPath);
        throw error;
      }
    }
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
    if (!RainbowRecordProto) {
      throw new Error("Protobuf type not initialized");
    }

    // Validate labelHash is not empty
    if (!record.labelHash || record.labelHash.length === 0) {
      throw new Error("Cannot serialize record with empty labelHash");
    }

    try {
      // Ensure write stream is open
      if (!this.writeStream) {
        await this.openForWriting();
      }

      // Create a proper protobuf buffer for the byte array
      const labelHashBuffer = Buffer.from(record.labelHash);

      // Create the message object directly with the camelCase fields
      // that protobuf.js expects
      const message = {
        labelHash: labelHashBuffer, // Protobuf.js converts this to the right proto field name
        label: record.label,
      };

      // Verify the message against the schema
      const errMsg = RainbowRecordProto.verify(message);
      if (errMsg) {
        throw new Error(`Invalid message: ${errMsg}`);
      }

      // Create and encode the message
      const pbMessage = RainbowRecordProto.create(message);
      const buffer = Buffer.from(RainbowRecordProto.encode(pbMessage).finish());

      // Write directly to the stream without length prefixing
      const isOk = this.writeStream!.write(buffer);
      if (!isOk) {
        // Wait for drain event if the buffer is full
        await once(this.writeStream!, "drain");
      }
    } catch (error) {
      console.error("Error during protobuf serialization:", error);
      throw error;
    }
  }

  /**
   * Attempt to decode a protobuf message from a buffer
   */
  private tryDecodeMessage(buffer: Buffer): { message: any; bytesRead: number } | null {
    try {
      // Protobuf decoder will throw if there's not enough data
      const decodedMessage = RainbowRecordProto.decode(buffer);
      
      // Re-encode to determine the consumed bytes
      const reEncoded = RainbowRecordProto.encode(decodedMessage).finish();
      const bytesRead = reEncoded.length;
      
      return { message: decodedMessage, bytesRead };
    } catch (error) {
      // Failed to decode, might need more data
      return null;
    }
  }

  /**
   * Reads a record from the input file
   * Returns null when there are no more records
   */
  async readRecord(): Promise<RainbowRecord | null> {
    try {
      if (!RainbowRecordProto) {
        throw new Error("Protobuf type not initialized");
      }

      // Ensure read stream is open
      if (!this.readStream) {
        await this.openForReading();
      }

      // First ensure we have a read stream and a remaining buffer
      if (!this.readStream || this.remainingBuffer === null) {
        return null;
      }

      // Keep reading data until we can decode a complete protobuf message
      while (true) {
        // Try to decode what we have in the buffer
        const result = this.tryDecodeMessage(this.remainingBuffer);
        
        // If we successfully decoded a message
        if (result) {
          const { message, bytesRead } = result;
          
          // Update the remaining buffer
          this.remainingBuffer = this.remainingBuffer.slice(bytesRead);
          
          // IMPORTANT: Protobuf.js converts snake_case field names to camelCase
          // so we need to access 'labelHash' not 'label_hash'
          const labelHash = message.labelHash;
          const label = message.label;
          
          // Ensure that the labelHash exists and is a proper byte array
          if (!labelHash || !(labelHash instanceof Uint8Array) || labelHash.length === 0) {
            console.error("labelHash invalid:", labelHash);
            throw new Error("Invalid protobuf message: missing or empty labelHash field");
          }
          
          // Convert to the expected RainbowRecord format
          return {
            labelHash: Uint8Array.from(labelHash) as ByteArray,
            label: label,
          };
        }
        
        // If we couldn't decode a message, try to read more data
        try {
          const [chunk] = await once(this.readStream, "data");
          if (!chunk) {
            return null; // End of file
          }
          this.remainingBuffer = Buffer.concat([this.remainingBuffer, chunk]);
        } catch (error) {
          // End of file or stream error
          if (this.remainingBuffer.length > 0) {
            console.warn("End of file with unprocessed buffer data:", this.remainingBuffer.length, "bytes");
          }
          return null;
        }
      }
    } catch (error) {
      console.error("Error in readRecord:", error);
      throw error;
    }
  }
}
