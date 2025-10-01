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
 * Parse CSV using csv-simple-parser with proper type safety
 */
function parseCsvLine(line: string): string[] {
  const result = parse(line, {optimistic: false});
  if (result.length === 0) return [];
  const firstRow = result[0];
  if (!Array.isArray(firstRow)) return [];
  return firstRow.map((item) => String(item));
}

export interface ConvertCsvCommandOptions {
  inputFile: string;
  outputFile: string;
  labelSetId: string;
  labelSetVersion: number;
  progressInterval?: number;
}

// Configuration constants
const DEFAULT_PROGRESS_INTERVAL = 10000;

interface ConversionStats {
  totalLines: number;
  processedRecords: number;
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
  logger.info(`Duration: ${duration}ms`);
}

/**
 * Initialize conversion setup and logging
 */
function initializeConversion(options: ConvertCsvCommandOptions) {
  logger.info("Starting conversion from CSV to protobuf format...");
  logger.info(`Input file: ${options.inputFile}`);
  logger.info(`Output file: ${options.outputFile}`);
  logger.info(`Label set id: ${options.labelSetId}`);
  logger.info(`Label set version: ${options.labelSetVersion}`);

  const { RainbowRecordType, RainbowRecordCollectionType } = createRainbowProtobufRoot();
  const outputStream = setupWriteStream(options.outputFile);

  writeHeader(
    outputStream,
    RainbowRecordCollectionType,
    options.labelSetId,
    options.labelSetVersion,
  );

  logger.info("Reading and processing CSV file line by line with streaming...");

  return { RainbowRecordType, outputStream };
}

/**
 * Create rainbow record from parsed CSV columns
 */
function createRainbowRecord(parsedColumns: string[]): { labelhash: Buffer; label: string } {
  const label = parsedColumns[0];

  if (parsedColumns.length === 1) {
    // Single column: compute labelhash using labelhash function
    const labelHashBytes = labelHashToBytes(labelhash(label));
    console.log(label);
    return {
      labelhash: Buffer.from(labelHashBytes),
      label: label,
    };
  } else {
    // Two columns: validate and use provided hash
    const [, providedHash] = parsedColumns;
    const maybeLabelHash = providedHash.startsWith("0x") ? providedHash : `0x${providedHash}`;
    const labelHash = labelHashToBytes(maybeLabelHash as LabelHash);
    return {
      labelhash: Buffer.from(labelHash),
      label: label,
    };
  }
}

/**
 * Process a single CSV record
 */
function processRecord(
  line: string,
  expectedColumns: number,
  RainbowRecordType: any,
  outputStream: NodeJS.WritableStream,
): void {
  const parsedColumns = processStreamingCsvLine(line, expectedColumns);
  const rainbowRecord = createRainbowRecord(parsedColumns);

  // Create protobuf message and write immediately
  const recordMessage = RainbowRecordType.fromObject(rainbowRecord);
  outputStream.write(Buffer.from(RainbowRecordType.encodeDelimited(recordMessage).finish()));
}

/**
 * Process the entire CSV file
 */
async function processCSVFile(
  rl: ReturnType<typeof setupReadStream>,
  RainbowRecordType: any,
  outputStream: NodeJS.WritableStream,
  progressInterval: number,
): Promise<{ totalLines: number; processedRecords: number }> {
  let expectedColumns: number | null = null;
  let lineNumber = 0;
  let processedRecords = 0;

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

      processRecord(line, expectedColumns, RainbowRecordType, outputStream);
      processedRecords++;

      // Log progress for large files
      if (processedRecords % progressInterval === 0) {
        logger.info(`Processed ${processedRecords} records so far...`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `CSV conversion failed due to invalid data on line ${lineNumber}: ${errorMessage}`,
      );
    }
  }

  return { totalLines: lineNumber, processedRecords };
}

/**
 * Main CSV conversion command with true streaming using csv-simple-parser
 */
export async function convertCsvCommand(options: ConvertCsvCommandOptions): Promise<void> {
  const stats: ConversionStats = {
    totalLines: 0,
    processedRecords: 0,
    startTime: new Date(),
  };

  let rl: ReturnType<typeof setupReadStream> | null = null;

  try {
    const { RainbowRecordType, outputStream } = initializeConversion(options);

    // Setup streaming CSV reader
    rl = setupReadStream(options.inputFile);

    const progressInterval = options.progressInterval ?? DEFAULT_PROGRESS_INTERVAL;

    // Process the CSV file
    const { totalLines, processedRecords } = await processCSVFile(
      rl,
      RainbowRecordType,
      outputStream,
      progressInterval,
    );

    stats.totalLines = totalLines;
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
  } finally {
    // Ensure readline interface is properly closed to prevent resource leaks
    if (rl) {
      rl.close();
    }
  }
}
