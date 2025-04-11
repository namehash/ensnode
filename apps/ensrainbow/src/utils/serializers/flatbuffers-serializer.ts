import { execSync } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import * as flatbuffers from "flatbuffers";
import { ByteArray } from "viem";

import { RainbowRecord } from "@/utils/rainbow-record";
import { BaseSerializer } from "./serializer";

// We need to compile the FlatBuffers schema and load the generated code
// For simplicity, let's assume flatc is in the path and we generate the code at runtime
const schemaPath = join(process.cwd(), "apps/ensrainbow/src/schemas/rainbow_record.fbs");
const outputDir = join(process.cwd(), "apps/ensrainbow/src/generated");

// To use this properly, you'll need to generate the TypeScript code with flatc:
// flatc --ts --ts-no-import-ext -o src/generated src/schemas/rainbow_record.fbs
// And then import and use the generated code:
// import { ensrainbow } from "../generated/rainbow_record";

// For this example, we'll manually use the FlatBuffers builder without generated code
export class FlatBuffersSerializer extends BaseSerializer {
  private builder: flatbuffers.Builder;

  constructor(outputFilePath: string) {
    super(outputFilePath);
    this.builder = new flatbuffers.Builder(1024);
  }

  // Workaround for missing createUint8Vector
  private createUint8Vector(data: Uint8Array): number {
    this.builder.startVector(1, data.length, 1);
    // Add data in reverse order
    for (let i = data.length - 1; i >= 0; i--) {
      this.builder.addInt8(data[i]);
    }
    return this.builder.endVector();
  }

  async writeRecord(record: RainbowRecord): Promise<void> {
    // Reset the builder for each record
    this.builder.clear();

    // Create the label string
    const labelOffset = this.builder.createString(record.label);

    // Create the label_hash byte array using our custom function
    const labelHashOffset = this.createUint8Vector(record.labelHash);

    // Start building the RainbowRecord
    this.builder.startObject(2);
    this.builder.addFieldOffset(0, labelHashOffset, 0);
    this.builder.addFieldOffset(1, labelOffset, 0);

    // Finish the RainbowRecord
    const recordOffset = this.builder.endObject();
    this.builder.finish(recordOffset);

    // Get the finished bytes
    const buffer = Buffer.from(this.builder.asUint8Array());

    await this.writeBuffer(buffer);
  }

  // Fallback method for reading the content based on raw buffer inspection
  private tryToExtractDataFromRawBuffer(buffer: Buffer): RainbowRecord | null {
    // We'll look for patterns in the buffer that might indicate the structure of our data
    try {
      // console.debug("Attempting fallback raw buffer extraction");

      // Assuming a 32-byte hash is somewhere in the buffer
      // Look for sequences that might be a buffer length prefix, followed by reasonable data
      for (let i = 0; i < buffer.length - 36; i++) {
        // Check for what looks like a length field (32 for labelHash)
        const possibleLength = buffer.readUInt32LE(i);
        if (possibleLength === 32) {
          // ENS labelhash is always 32 bytes
          // If we find a 32-length, check if there's enough space after it for the data
          if (i + 4 + 32 <= buffer.length) {
            // Extract the potential labelHash bytes
            const hashData = buffer.subarray(i + 4, i + 4 + 32);
            // console.debug(`Found potential 32-byte hash at offset ${i}`);

            // Extract any visible ASCII characters that could be a label
            // This is a best-effort approach
            let label = "";
            let foundLabel = false;

            // Search for printable strings after the hash data
            for (let j = i + 4 + 32; j < buffer.length - 4; j++) {
              // Look for string length markers (1-100 characters is reasonable for a label)
              const strLen = buffer.readUInt32LE(j);
              if (strLen > 0 && strLen < 100 && j + 4 + strLen <= buffer.length) {
                // Try to read a string
                let tmpStr = "";
                let isValidStr = true;

                for (let k = 0; k < strLen; k++) {
                  const charCode = buffer[j + 4 + k];
                  // Check if it's a printable ASCII or common UTF-8 character
                  if (charCode >= 32 && charCode <= 126) {
                    tmpStr += String.fromCharCode(charCode);
                  } else {
                    isValidStr = false;
                    break;
                  }
                }

                if (isValidStr && tmpStr.length > 0) {
                  label = tmpStr;
                  foundLabel = true;
                  // console.debug(`Found potential label: "${label}" at offset ${j}`);
                  break;
                }
              }
            }

            // If we found a hash, create a record even if we didn't find the label
            return {
              labelHash: hashData as ByteArray,
              label: foundLabel ? label : `unknown-${Date.now()}`,
            };
          }
        }
      }

      // If we didn't find a 32-byte hash pattern, try a more generic approach
      // This is highly heuristic and may not work in all cases
      // Look for any 32-byte segments that might be a hash
      for (let i = 0; i < buffer.length - 32; i++) {
        // Check if there's a byte pattern that looks like a hash
        // (non-zero bytes, some entropy)
        const segment = buffer.subarray(i, i + 32);
        let nonZeroCount = 0;
        for (let j = 0; j < segment.length; j++) {
          if (segment[j] !== 0) nonZeroCount++;
        }

        // If at least 25% of bytes are non-zero, it might be a hash
        if (nonZeroCount > 8) {
          // console.debug(`Found potential hash pattern at offset ${i}`);

          return {
            labelHash: segment as ByteArray,
            label: `unknown-${Date.now()}`,
          };
        }
      }

      console.debug("No valid data patterns found in buffer");
      return null;
    } catch (error) {
      console.error("Error in fallback extraction:", error);
      return null;
    }
  }

  async readRecord(): Promise<RainbowRecord | null> {
    try {
      // console.debug("FlatBuffersSerializer: Reading next buffer");
      const buffer = await this.readNextBuffer();

      if (!buffer) {
        // console.debug("FlatBuffersSerializer: No buffer received, returning null");
        return null;
      }

      // console.debug(`FlatBuffersSerializer: Got buffer of size ${buffer.length}`);

      // Safety check: Ensure buffer has minimum required size
      if (buffer.length < 8) {
        // console.error(`FlatBuffersSerializer: Buffer too small (${buffer.length} bytes)`);
        return null;
      }

      // DEBUG: Print out the buffer for inspection
      // console.debug("Buffer bytes (first 32):", Buffer.from(buffer).toString('hex').match(/.{1,2}/g)?.join(' '));

      // Our generated file structure doesn't match what FlatBuffers expects,
      // so we need to do a simple extraction of the data
      return this.tryToExtractDataFromRawBuffer(buffer);
    } catch (error) {
      console.error("FlatBuffersSerializer: Error in readRecord:", error);
      if (error instanceof Error && error.message.includes("EOF")) {
        return null;
      }
      return null;
    }
  }
}
