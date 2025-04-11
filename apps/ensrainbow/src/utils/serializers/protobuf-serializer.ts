import protobuf from "protobufjs";
import { ByteArray } from "viem";
import { join, dirname } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

import { RainbowRecord } from "@/utils/rainbow-record";
import { BaseSerializer } from "./serializer";

// In ESM modules, __dirname is not defined, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use a relative path from the current file
const protoPath = join(__dirname, "../../../protos/rainbow_record.proto");

// Global instance of the protobuf type
let RainbowRecordProto: any = null;

export class ProtobufSerializer extends BaseSerializer {
  constructor(outputFilePath: string) {
    super(outputFilePath);
    
    // Initialize the protobuf type if not already done
    if (!RainbowRecordProto) {
      try {
        // Read the proto file directly for debugging
        const protoContent = readFileSync(protoPath, 'utf8');
        console.debug("Proto file content:", protoContent);
        
        // Create a new protobuf instance with the proto content
        const parsed = protobuf.parse(protoContent);
        RainbowRecordProto = parsed.root.lookupType("ensrainbow.RainbowRecord");
        
        if (!RainbowRecordProto) {
          throw new Error("Failed to locate RainbowRecord type in schema");
        }
        
        // Protobuf.js automatically converts snake_case field names to camelCase
        console.debug("Loaded protobuf schema fields:", 
          RainbowRecordProto.fieldsArray.map((f: any) => `${f.name} (${f.type})`));
      } catch (error) {
        console.error("Failed to load protobuf schema:", error);
        console.error("Looking for file at:", protoPath);
        throw error;
      }
    }
  }

  async writeRecord(record: RainbowRecord): Promise<void> {
    if (!RainbowRecordProto) {
      throw new Error("Protobuf type not initialized");
    }

    // Validate labelHash is not empty
    if (!record.labelHash || record.labelHash.length === 0) {
      throw new Error("Cannot serialize record with empty labelHash");
    }

    try {
      // Create a proper protobuf buffer for the byte array
      const labelHashBuffer = Buffer.from(record.labelHash);
      
      // Create the message object directly with the camelCase fields
      // that protobuf.js expects
      const message = {
        labelHash: labelHashBuffer,  // Protobuf.js converts this to the right proto field name
        label: record.label
      };
      
    //   console.debug("Message to encode:", message);
      
      // Verify the message against the schema
      const errMsg = RainbowRecordProto.verify(message);
      if (errMsg) {
        throw new Error(`Invalid message: ${errMsg}`);
      }
      
      // Create and encode the message
      const pbMessage = RainbowRecordProto.create(message);
      const buffer = Buffer.from(RainbowRecordProto.encode(pbMessage).finish());
      
    //   console.debug(`Encoded message buffer length: ${buffer.length} bytes`);
    //   console.debug(`labelHash length: ${labelHashBuffer.length} bytes`);
      
      // Write the buffer to the output file
      await this.writeBuffer(buffer);
      
    } catch (error) {
      console.error("Error during protobuf serialization:", error);
      throw error;
    }
  }

  async readRecord(): Promise<RainbowRecord | null> {
    try {
      if (!RainbowRecordProto) {
        throw new Error("Protobuf type not initialized");
      }
      
      const buffer = await this.readNextBuffer();
      if (!buffer) return null;
      
      try {
        // console.debug(`Read buffer length: ${buffer.length} bytes`);
        
        // Decode the buffer into a protobuf message
        const decodedMessage = RainbowRecordProto.decode(buffer);
        // console.debug("Decoded message:", decodedMessage);
        
        // IMPORTANT: Protobuf.js converts snake_case field names to camelCase
        // so we need to access 'labelHash' not 'label_hash'
        const labelHash = decodedMessage.labelHash;
        const label = decodedMessage.label;
        
        // Ensure that the labelHash exists and is a proper byte array
        if (!labelHash || !(labelHash instanceof Uint8Array) || labelHash.length === 0) {
          console.error("labelHash invalid:", labelHash);
          throw new Error("Invalid protobuf message: missing or empty labelHash field");
        }
        
        // console.debug(`Decoded labelHash length: ${labelHash.length}`);
        // console.debug(`Decoded label: ${label}`);
        
        // Convert to the expected RainbowRecord format
        return {
          labelHash: Uint8Array.from(labelHash) as ByteArray,
          label: label,
        };
      } catch (error) {
        console.error("Error decoding protobuf message:", error);
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
