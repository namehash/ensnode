/**
 * ENSRAINBOW CSV FILE CREATION COMMAND
 *
 * Converts CSV files to .ensrainbow format with csv-simple-parser
 * Supports 1-column (label only) and 2-column (label,labelhash) formats
 */

import { createReadStream, createWriteStream } from "fs";
import { createInterface } from "readline";
import { type LabelHash, labelHashToBytes } from "@ensnode/ensnode-sdk";
import parse from "csv-simple-parser";
import { labelhash } from "viem";
import { logger } from "../utils/logger.js";
import {
  CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
  createRainbowProtobufRoot,
} from "../utils/protobuf-schema.js";

/**
 * Parse CSV using csv-simple-parser
 */
function parseCsvLine(line: string): string[] {
  const result = parse(line);
  return result.length > 0 ? (result[0] as string[]) : [];
}

// No label validation - ENS accepts any UTF-8 string

export interface ConvertCsvCommandOptions {
  inputFile: string;
  outputFile: string;
  labelSetId: string;
  labelSetVersion: number;
}

interface ConversionStats {
  totalLines: number;
  processedRecords: number;
  skippedRecords: number;
  invalidLabels: number;
  duplicates: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Process a single CSV line with csv-simple-parser and validation
 */
function processStreamingCsvLine(line: string, expectedColumns: number): string[] {
  if (line.trim() === "") {
    throw new Error("Empty line");
  }

  const parsedLine = parseCsvLine(line);

  // Validate column count
  if (parsedLine.length !== expectedColumns) {
    throw new Error(
      `Expected ${expectedColumns} columns, but found ${parsedLine.length} in line: ${line}`,
    );
  }

  return parsedLine;
}

/**
 * Setup input stream for reading CSV line by line
 */
function setupReadStream(inputFile: string) {
  const fileStream = createReadStream(inputFile, { encoding: "utf8" });
  return createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
}

/**
 * Setup output stream for writing protobuf
 */
function setupWriteStream(outputFile: string) {
  // For now, just write directly to file without gzip compression
  return createWriteStream(outputFile);
}

/**
 * Write protobuf header
 */
function writeHeader(
  outputStream: NodeJS.WritableStream,
  RainbowRecordCollectionType: any,
  labelSetId: string,
  labelSetVersion: number,
) {
  const headerCollection = RainbowRecordCollectionType.fromObject({
    format_identifier: "ensrainbow",
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
 * Log conversion summary
 */
function logSummary(stats: ConversionStats) {
  stats.endTime = new Date();
  const duration = stats.endTime.getTime() - stats.startTime.getTime();

  logger.info("=== Conversion Summary ===");
  logger.info(`Total lines processed: ${stats.totalLines}`);
  logger.info(`Valid records: ${stats.processedRecords}`);
  logger.info(`Skipped records: ${stats.skippedRecords}`);
  logger.info(`Invalid labels: ${stats.invalidLabels}`);
  logger.info(`Duplicates found: ${stats.duplicates}`);
  logger.info(`Duration: ${duration}ms`);
}

/**
 * Main CSV conversion command with true streaming using csv-simple-parser
 */
export async function convertCsvCommand(options: ConvertCsvCommandOptions): Promise<void> {
  const stats: ConversionStats = {
    totalLines: 0,
    processedRecords: 0,
    skippedRecords: 0,
    invalidLabels: 0,
    duplicates: 0,
    startTime: new Date(),
  };

  try {
    logger.info("Starting conversion from CSV to protobuf format...");
    logger.info(`Input file: ${options.inputFile}`);
    logger.info(`Output file: ${options.outputFile}`);
    logger.info(`Label set id: ${options.labelSetId}`);
    logger.info(`Label set version: ${options.labelSetVersion}`);

    // Setup protobuf schema
    const { RainbowRecordType, RainbowRecordCollectionType } = createRainbowProtobufRoot();

    // Setup streams
    const outputStream = setupWriteStream(options.outputFile);

    // Write header
    writeHeader(
      outputStream,
      RainbowRecordCollectionType,
      options.labelSetId,
      options.labelSetVersion,
    );

    logger.info("Reading and processing CSV file line by line with streaming...");

    // Setup streaming CSV reader
    const rl = setupReadStream(options.inputFile);

    let expectedColumns: number | null = null;
    let lineNumber = 0;
    let processedRecords = 0;

    // Process line by line with csv-simple-parser
    for await (const line of rl) {
      lineNumber++;

      // Skip empty lines
      if (line.trim() === "") {
        continue;
      }

      try {
        // For the first line, detect column count
        if (expectedColumns === null) {
          const firstLineParsed = parseCsvLine(line);
          expectedColumns = firstLineParsed.length;
          logger.info(`Detected ${expectedColumns} columns using csv-simple-parser`);
        }

        // Parse current line with csv-simple-parser
        const parsedColumns = processStreamingCsvLine(line, expectedColumns);

        // Get label (no validation - ENS accepts any UTF-8 string)
        const label = parsedColumns[0];

        // Build rainbow record immediately (streaming)
        let rainbowRecord;

        if (parsedColumns.length === 1) {
          // Single column: compute labelhash using labelhash function
          const labelHashBytes = labelHashToBytes(labelhash(label));

          rainbowRecord = {
            labelhash: Buffer.from(labelHashBytes),
            label: label,
          };
        } else {
          // Two columns: validate and use provided hash
          const [, providedHash] = parsedColumns;

          // Ensure the hash has 0x prefix for labelHashToBytes
          const maybeLabelHash = providedHash.startsWith("0x") ? providedHash : `0x${providedHash}`;
          const labelHash = labelHashToBytes(maybeLabelHash as LabelHash);

          rainbowRecord = {
            labelhash: Buffer.from(labelHash),
            label: label,
          };
        }

        // Create protobuf message and write immediately
        const recordMessage = RainbowRecordType.fromObject(rainbowRecord);
        outputStream.write(Buffer.from(RainbowRecordType.encodeDelimited(recordMessage).finish()));

        processedRecords++;

        // Log progress for large files
        if (processedRecords % 10000 === 0) {
          logger.info(`Processed ${processedRecords} records so far...`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `CSV conversion failed due to invalid data on line ${lineNumber}: ${errorMessage}`,
        );
      }
    }

    stats.totalLines = lineNumber;
    stats.processedRecords = processedRecords;

    // Close output stream
    outputStream.end();

    logger.info(`✅ Processed ${processedRecords} records with streaming csv-simple-parser`);

    logSummary(stats);
    logger.info("✅ CSV conversion completed successfully!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("❌ CSV conversion failed:", errorMessage);
    throw error;
  }
}
