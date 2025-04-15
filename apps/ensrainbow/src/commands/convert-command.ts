import { createReadStream, createWriteStream } from "fs";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import ProgressBar from "progress";

import { logger } from "@/utils/logger";
import { createRainbowProtobufRoot } from "@/utils/protobuf-schema";
import { buildRainbowRecord } from "@/utils/rainbow-record";

export interface ConvertCommandOptions {
  inputFile: string;
  outputFile: string;
}

/**
 * Converts rainbow tables from SQL dump directly to protobuf format
 * Uses a streaming approach to avoid memory issues with large datasets
 * 
 * The output format is a standard length-prefixed protobuf stream:
 * - Each message is prefixed with its length as a varint
 * - This allows for cross-platform compatibility with other protobuf implementations
 */
export async function convertCommand(options: ConvertCommandOptions): Promise<void> {
  try {
    logger.info("Starting conversion from SQL dump to protobuf format...");
    logger.info(`Input file: ${options.inputFile}`);
    logger.info(`Output file: ${options.outputFile}`);
    
    // Set up progress bar
    const bar = new ProgressBar(
      "Processing [:bar] :current records processed - :rate records/sec - :etas remaining",
      {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: 150000000, // estimated
      },
    );
    
    // Create a read stream for the gzipped file
    const fileStream = createReadStream(options.inputFile);
    const gunzip = createGunzip();
    const rl = createInterface({
      input: fileStream.pipe(gunzip),
      crlfDelay: Infinity,
    });
    
    // Create a write stream for the output file
    const outputStream = createWriteStream(options.outputFile);
    
    // Use the shared protobuf schema - we only need the RainbowRecord type, not the collection
    const { RainbowRecordType } = createRainbowProtobufRoot();
    
    let isCopySection = false;
    let processedRecords = 0;
    let invalidRecords = 0;
    
    logger.info("Parsing SQL dump file...");
    
    for await (const line of rl) {
      if (line.startsWith("COPY public.ens_names")) {
        isCopySection = true;
        continue;
      }
      
      if (line.startsWith("\\.")) {
        break;
      }
      
      if (!isCopySection) {
        continue;
      }
      
      try {
        // Parse the record from SQL dump
        const record = buildRainbowRecord(line);
        
        // Create a protobuf message for just this record
        const message = RainbowRecordType.fromObject({
          label_hash: Buffer.from(record.labelHash),
          label: record.label
        });
        
        // Encode the record
        const buffer = RainbowRecordType.encode(message).finish();
        
        // Write the message with length-prefix encoding (standard protobuf delimited format)
        // Using the Protobuf.js built-in method that handles the proper varint encoding
        outputStream.write(Buffer.from(RainbowRecordType.encodeDelimited(message).finish()));
        
        processedRecords++;
        
        // Update progress bar
        bar.tick();
        
      } catch (e) {
        if (e instanceof Error) {
          logger.warn(
            `Skipping invalid record: ${e.message} - this record is safe to skip as it would be unreachable by the ENS Subgraph`,
          );
        } else {
          logger.warn(`Unknown error processing record - skipping`);
        }
        invalidRecords++;
        continue;
      }
    }
    
    // Close the output stream to ensure all data is written
    outputStream.end();
    
    logger.info(`\nSQL parsing complete! Processed ${processedRecords} records`);
    if (invalidRecords > 0) {
      logger.warn(`Skipped ${invalidRecords} invalid records`);
    }
    
    logger.info(`Conversion complete! ${processedRecords} records written to ${options.outputFile}`);
    logger.info(`The file is in standard protobuf delimited format and can be read by any protobuf implementation.`);
    
  } catch (error) {
    logger.error(`Error during conversion: ${error}`);
    throw error;
  }
} 
