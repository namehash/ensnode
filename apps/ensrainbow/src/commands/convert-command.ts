import { createReadStream } from "fs";
import { writeFileSync } from "fs";
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
 */
export async function convertCommand(options: ConvertCommandOptions): Promise<void> {
  try {
    logger.info("Starting conversion from SQL dump to protobuf format...");
    logger.info(`Input file: ${options.inputFile}`);
    logger.info(`Output file: ${options.outputFile}`);
    
    // Create a simple in-memory collection
    const records = [];
    
    // Set up progress bar
    const bar = new ProgressBar(
      "Processing [:bar] :current records processed - :rate records/sec - :etas remaining",
      {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: 150000000, // estimated, will be updated after parsing
      },
    );
    
    // Create a read stream for the gzipped file
    const fileStream = createReadStream(options.inputFile);
    const gunzip = createGunzip();
    const rl = createInterface({
      input: fileStream.pipe(gunzip),
      crlfDelay: Infinity,
    });
    
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
      
      let record;
      try {
        record = buildRainbowRecord(line);
        
        // Add the record to our collection
        records.push({
          label_hash: Buffer.from(record.labelHash),
          label: record.label
        });
        
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
    
    logger.info(`\nSQL parsing complete! Processed ${processedRecords} records`);
    if (invalidRecords > 0) {
      logger.warn(`Skipped ${invalidRecords} invalid records`);
    }
    
    // Use the shared protobuf schema
    logger.info("Setting up protobuf encoder...");
    const { RainbowRecordCollectionType } = createRainbowProtobufRoot();
    
    // Create the collection message
    const message = RainbowRecordCollectionType.fromObject({
      records: records
    });
    
    // Encode the collection
    logger.info("Encoding protobuf data...");
    const buffer = RainbowRecordCollectionType.encode(message).finish();
    
    // Write the buffer to the output file
    logger.info(`Writing protobuf data to ${options.outputFile}...`);
    writeFileSync(options.outputFile, buffer);
    
    logger.info(`Conversion complete! ${processedRecords} records written to ${options.outputFile}`);
    logger.info(`File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    logger.error(`Error during conversion: ${error}`);
    throw error;
  }
} 
