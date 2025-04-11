import { ByteArray } from "viem";
import * as capnp from "capnp-ts";
import { join } from "path";

import { RainbowRecord } from "@/utils/rainbow-record";
import { BaseSerializer } from "./serializer";

// Note: For full implementation, you would need to generate TypeScript code from the Cap'n Proto schema
// using the capnpc-ts compiler. This example is simplified for demonstration purposes.

export class CapnProtoSerializer extends BaseSerializer {
  constructor(outputFilePath: string) {
    super(outputFilePath);
  }

  async writeRecord(record: RainbowRecord): Promise<void> {
    // This example uses a raw message and structured data
    // In a real implementation, you would use generated code from the schema

    try {
      // Create a message and get the first segment
      const message = new capnp.Message();
      const segment = message.getSegment(0);
      
      // Serialize the data as a simple binary format that mimics Cap'n Proto
      // This isn't true Cap'n Proto format but demonstrates the concept
      
      // First 8 bytes: length of labelHash
      // Next N bytes: labelHash data
      // Next A: 8-byte padding to 8-byte boundary
      // Next 8 bytes: length of label
      // Next M bytes: label data as UTF-8
      
      // Convert the label to UTF-8 bytes
      const labelBytes = Buffer.from(record.label, 'utf8');
      
      // Calculate total size
      const labelHashLength = record.labelHash.length;
      const labelLength = labelBytes.length;
      const totalSize = 16 + labelHashLength + labelLength;
      
      // Allocate memory in the segment
      const contentOffset = segment.allocate(totalSize);
      
      // Create a buffer for the entire message
      const buffer = new ArrayBuffer(totalSize);
      const view = new DataView(buffer);
      let offset = 0;
      
      // Write labelHash length
      view.setUint32(offset, labelHashLength, true);
      offset += 8; // 8 bytes for alignment
      
      // Write labelHash content
      for (let i = 0; i < labelHashLength; i++) {
        view.setUint8(offset + i, record.labelHash[i]);
      }
      offset += labelHashLength;
      
      // Write label length
      view.setUint32(offset, labelLength, true);
      offset += 8; // 8 bytes for alignment
      
      // Write label content
      for (let i = 0; i < labelLength; i++) {
        view.setUint8(offset + i, labelBytes[i]);
      }
      
      // Write to our output stream
      await this.writeBuffer(new Uint8Array(buffer));
    } catch (error) {
      console.error("Error serializing record:", error);
      throw error;
    }
  }

  async readRecord(): Promise<RainbowRecord | null> {
    try {
      const buffer = await this.readNextBuffer();
      if (!buffer) return null;
      
      // Read the data using the same simple format as in writeRecord
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      let offset = 0;
      
      // Read labelHash length
      const labelHashLength = view.getUint32(offset, true);
      offset += 8; // 8 bytes for alignment
      
      // Read labelHash content
      const labelHash = new Uint8Array(labelHashLength);
      for (let i = 0; i < labelHashLength; i++) {
        labelHash[i] = view.getUint8(offset + i);
      }
      offset += labelHashLength;
      
      // Read label length
      const labelLength = view.getUint32(offset, true);
      offset += 8; // 8 bytes for alignment
      
      // Read label content
      const labelBytes = new Uint8Array(labelLength);
      for (let i = 0; i < labelLength; i++) {
        labelBytes[i] = view.getUint8(offset + i);
      }
      
      // Convert the bytes back to a string
      const label = new TextDecoder().decode(labelBytes);
      
      return {
        labelHash: labelHash as ByteArray,
        label,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("EOF")) {
        return null;
      }
      console.error("Error deserializing record:", error);
      throw error;
    }
  }
} 
