import { createReadStream, createWriteStream } from "fs";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import ProgressBar from "progress";

import { logger } from "@/utils/logger";
import { createRainbowProtobufRoot } from "@/utils/protobuf-schema";
import { buildRainbowRecord } from "@/utils/rainbow-record";
import { type LabelSetId, type LabelSetVersion } from "@ensnode/ensrainbow-sdk";

export interface ConvertCommandOptions {
  inputFile: string;
  outputFile: string;
  labelSetId: LabelSetId;
  labelSetVersion: LabelSetVersion;
}

// Current protobuf file format version
export const CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION = 1;

/**
 * Logs the initial options for the conversion process.
 */
function logInitialOptions(options: ConvertCommandOptions): void {
  logger.info("Starting conversion from SQL dump to protobuf format...");
  logger.info(`Input file: ${options.inputFile}`);
  logger.info(`Output file: ${options.outputFile}`);
  logger.info(`Label set id: ${options.labelSetId}`);
  logger.info(`Label set version: ${options.labelSetVersion}`);
  logger.info(`.ensrainbow File Format Version: ${CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION}`);
  logger.info("Output format: Header message + stream of individual records");
}

/**
 * Sets up the progress bar for the conversion process.
 */
function setupProgressBar(): ProgressBar {
  return new ProgressBar(
    "Processing [:bar] :current records processed - :rate records/sec - :etas remaining",
    {
      complete: "=",
      incomplete: " ",
      width: 40,
      total: 150000000, // estimated
    },
  );
}

/**
 * Sets up the read stream for the input file.
 */
function setupReadStream(inputFile: string): ReturnType<typeof createInterface> {
  const fileStream = createReadStream(inputFile);
  const gunzip = createGunzip();
  return createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity,
  });
}

/**
 * Sets up the write stream for the output file.
 */
function setupWriteStream(outputFile: string): ReturnType<typeof createWriteStream> {
  return createWriteStream(outputFile);
}

/**
 * Writes the header message to the output stream.
 */
function writeHeader(
  outputStream: ReturnType<typeof createWriteStream>,
  RainbowRecordCollectionType: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  labelSetId: LabelSetId,
  labelSetVersion: LabelSetVersion,
): void {
  const headerCollection = RainbowRecordCollectionType.fromObject({
    ensrainbow_file_format_version: CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
    label_set_id: labelSetId,
    label_set_version: labelSetVersion,
    records: [], // Header has no records
  });
  // Encode and write the header collection with length-prefix encoding
  outputStream.write(
    Buffer.from(RainbowRecordCollectionType.encodeDelimited(headerCollection).finish()),
  );
  logger.info("Wrote header message with version, label set id and label set version.");
}

/**
 * Processes the records from the SQL dump file and writes them to the output stream.
 */
async function processRecords(
  rl: ReturnType<typeof createInterface>,
  outputStream: ReturnType<typeof createWriteStream>,
  RainbowRecordType: protobuf.Type,
  bar: ProgressBar,
): Promise<{ processedRecords: number; invalidRecords: number }> {
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
        labelhash: Buffer.from(record.labelHash),
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
  return { processedRecords, invalidRecords };
}

/**
 * Logs the summary of the conversion process.
 */
function logSummary(processedRecords: number, invalidRecords: number, outputFile: string): void {
  logger.info(`\nSQL parsing complete! Processed ${processedRecords} records`);
  if (invalidRecords > 0) {
    logger.warn(`Skipped ${invalidRecords} invalid records`);
  }

  logger.info(`Conversion complete! ${processedRecords} records written to ${outputFile}`);
  logger.info(
    `The file contains a header message followed by ${processedRecords} individual RainbowRecord messages.`,
  );
}

/**
 * Converts rainbow tables from SQL dump directly to protobuf format
 * Uses a streaming approach to avoid memory issues with large datasets
 *
 * The output format consists of:
 * 1. A single header message (RainbowRecordCollection) containing version, label set id and label set version.
 * 2. A stream of individual RainbowRecord messages, each length-prefixed.
 */
export async function convertCommand(options: ConvertCommandOptions): Promise<void> {
  try {
    const { labelSetId, labelSetVersion } = options;

    logInitialOptions(options);

    // Set up progress bar
    const bar = setupProgressBar();

    // Create a read stream for the gzipped file
    const readlineInterface = setupReadStream(options.inputFile);

    // Create a write stream for the output file
    const outputStream = setupWriteStream(options.outputFile);

    // Use the shared protobuf schema - need both record and collection types
    const { RainbowRecordType, RainbowRecordCollectionType } = createRainbowProtobufRoot();

    // --- Write Header ---
    writeHeader(outputStream, RainbowRecordCollectionType, labelSetId, labelSetVersion);
    // --- End Header ---

    const { processedRecords, invalidRecords } = await processRecords(
      readlineInterface,
      outputStream,
      RainbowRecordType,
      bar,
    );

    // Close the output stream to ensure all data is written
    outputStream.end();

    logSummary(processedRecords, invalidRecords, options.outputFile);
  } catch (error) {
    logger.error(`Error during conversion: ${error}`);
    throw error;
  }
}
