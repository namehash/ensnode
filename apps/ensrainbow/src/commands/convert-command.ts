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
  namespace: string;
  labelSet: number;
}

// Current protobuf file format version
export const CURRENT_FORMAT_VERSION = 1;

/**
 * Converts rainbow tables from SQL dump directly to protobuf format
 * Uses a streaming approach to avoid memory issues with large datasets
 *
 * The output format consists of:
 * 1. A single header message (RainbowRecordCollection) containing version, namespace and label set.
 * 2. A stream of individual RainbowRecord messages, each length-prefixed.
 */
export async function convertCommand(options: ConvertCommandOptions): Promise<void> {
  try {
    const namespace = options.namespace;
    const labelSet = options.labelSet;

    logger.info("Starting conversion from SQL dump to protobuf format...");
    logger.info(`Input file: ${options.inputFile}`);
    logger.info(`Output file: ${options.outputFile}`);
    logger.info(`Namespace: ${namespace}`);
    logger.info(`Label Set: ${labelSet}`);
    logger.info(`Format Version: ${CURRENT_FORMAT_VERSION}`);
    logger.info("Output format: Header message + stream of individual records");

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

    // Use the shared protobuf schema - need both record and collection types
    const { RainbowRecordType, RainbowRecordCollectionType } = createRainbowProtobufRoot();

    // --- Write Header ---
    const headerCollection = RainbowRecordCollectionType.fromObject({
      version: CURRENT_FORMAT_VERSION,
      namespace: namespace,
      label_set: labelSet,
      records: [], // Header has no records
    });
    // Encode and write the header collection with length-prefix encoding
    outputStream.write(
      Buffer.from(RainbowRecordCollectionType.encodeDelimited(headerCollection).finish()),
    );
    logger.info("Wrote header message with version, namespace and label set.");
    // --- End Header ---

    let isCopySection = false;
    let processedRecords = 0;
    let invalidRecords = 0;

    logger.info("Parsing SQL dump file and writing individual records...");

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

        // Create a protobuf message for this record
        const recordMessage = RainbowRecordType.fromObject({
          label_hash: Buffer.from(record.labelHash),
          label: record.label,
        });

        // Encode and write the individual record message with length-prefix encoding
        outputStream.write(Buffer.from(RainbowRecordType.encodeDelimited(recordMessage).finish()));
        processedRecords++;

        // Update progress bar
        bar.tick();

        // Log progress periodically
        if (processedRecords % 1000000 === 0) {
          logger.info(`Processed ${processedRecords} records so far`);
        }
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

    logger.info(
      `Conversion complete! ${processedRecords} records written to ${options.outputFile}`,
    );
    logger.info(
      `The file contains a header message followed by ${processedRecords} individual RainbowRecord messages.`,
    );
  } catch (error) {
    logger.error(`Error during conversion: ${error}`);
    throw error;
  }
}
