/**
 * ENSRAINBOW CSV FILE CREATION COMMAND
 *
 * Converts CSV files to .ensrainbow format with fast-csv
 * Supports 1-column (label only) and 2-column (label,labelhash) formats
 */

import { createReadStream, createWriteStream } from "fs";
import { type LabelHash, labelHashToBytes } from "@ensnode/ensnode-sdk";
import { parse } from "@fast-csv/parse";
import { labelhash } from "viem";
import { ENSRainbowDB } from "../lib/database.js";
import { logger } from "../utils/logger.js";
import {
  CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
  createRainbowProtobufRoot,
} from "../utils/protobuf-schema.js";

export interface ConvertCsvCommandOptions {
  inputFile: string;
  outputFile: string;
  labelSetId: string;
  labelSetVersion: number;
  progressInterval?: number;
  existingDbPath?: string; // Path to existing ENSRainbow database to check for existing labels
}

// Configuration constants
const DEFAULT_PROGRESS_INTERVAL = 10000;

interface ConversionStats {
  totalLines: number;
  processedRecords: number;
  filteredExistingLabels: number;
  filteredDuplicates: number;
  startTime: Date;
  endTime?: Date;
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
  logger.info(`Filtered existing labels: ${stats.filteredExistingLabels}`);
  logger.info(`Filtered duplicates: ${stats.filteredDuplicates}`);
  logger.info(`Duration: ${duration}ms`);
}

/**
 * Check if a labelhash exists in the ENSRainbow database
 */
async function checkLabelHashExists(db: ENSRainbowDB, labelHashBytes: Buffer): Promise<boolean> {
  try {
    const record = await db.getVersionedRainbowRecord(labelHashBytes);
    return record !== null;
  } catch (error) {
    // If there's an error checking, assume it doesn't exist
    return false;
  }
}

/**
 * Initialize conversion setup and logging
 */
async function initializeConversion(options: ConvertCsvCommandOptions) {
  logger.info("Starting conversion from CSV to protobuf format...");
  logger.info(`Input file: ${options.inputFile}`);
  logger.info(`Output file: ${options.outputFile}`);
  logger.info(`Label set id: ${options.labelSetId}`);
  logger.info(`Label set version: ${options.labelSetVersion}`);

  // Open existing database if path is provided
  let existingDb: ENSRainbowDB | null = null;
  if (options.existingDbPath) {
    try {
      logger.info(`Opening existing database for filtering: ${options.existingDbPath}`);
      existingDb = await ENSRainbowDB.open(options.existingDbPath);
      logger.info("Successfully opened existing database for label filtering");
    } catch (error) {
      logger.warn(`Failed to open existing database at ${options.existingDbPath}: ${error}`);
      logger.warn("Proceeding without filtering existing labels");
    }
  }

  const { RainbowRecordType, RainbowRecordCollectionType } = createRainbowProtobufRoot();
  const outputStream = setupWriteStream(options.outputFile);

  writeHeader(
    outputStream,
    RainbowRecordCollectionType,
    options.labelSetId,
    options.labelSetVersion,
  );

  logger.info("Reading and processing CSV file line by line with streaming...");

  return { RainbowRecordType, outputStream, existingDb };
}

/**
 * Create rainbow record from parsed CSV row
 */
function createRainbowRecord(row: string[]): { labelhash: Buffer; label: string } {
  const label = String(row[0]);

  if (row.length === 1) {
    // Single column: compute labelhash using labelhash function
    const labelHashBytes = labelHashToBytes(labelhash(label));
    console.log(label);
    return {
      labelhash: Buffer.from(labelHashBytes),
      label: label,
    };
  } else {
    // Two columns: validate and use provided hash
    const providedHash = String(row[1]);
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
async function processRecord(
  row: string[],
  expectedColumns: number,
  RainbowRecordType: any,
  outputStream: NodeJS.WritableStream,
  lineNumber: number,
  existingDb: ENSRainbowDB | null,
  writtenLabels: Set<string>,
  stats: ConversionStats,
): Promise<boolean> {
  // Validate column count
  if (row.length !== expectedColumns) {
    throw new Error(
      `Expected ${expectedColumns} columns, but found ${row.length} in line ${lineNumber}`,
    );
  }

  const rainbowRecord = createRainbowRecord(row);
  const label = rainbowRecord.label;
  const labelHashBytes = rainbowRecord.labelhash;

  // Check if labelhash already exists in the database
  if (existingDb) {
    const existsInDb = await checkLabelHashExists(existingDb, labelHashBytes);
    if (existsInDb) {
      stats.filteredExistingLabels++;
      return false; // Skip this record
    }
  }

  // Check if label is a duplicate within this conversion
  if (writtenLabels.has(label)) {
    stats.filteredDuplicates++;
    return false; // Skip this record
  }

  // Add label to written set to track duplicates
  writtenLabels.add(label);

  // Create protobuf message and write immediately
  const recordMessage = RainbowRecordType.fromObject(rainbowRecord);
  outputStream.write(Buffer.from(RainbowRecordType.encodeDelimited(recordMessage).finish()));

  return true; // Record was processed
}

/**
 * Process the entire CSV file using fast-csv
 */
async function processCSVFile(
  inputFile: string,
  RainbowRecordType: any,
  outputStream: NodeJS.WritableStream,
  progressInterval: number,
  existingDb: ENSRainbowDB | null,
  stats: ConversionStats,
): Promise<{ totalLines: number; processedRecords: number }> {
  return new Promise((resolve, reject) => {
    let expectedColumns: number | null = null;
    let lineNumber = 0;
    let processedRecords = 0;
    const writtenLabels = new Set<string>(); // Track labels written in this conversion

    const fileStream = createReadStream(inputFile, { encoding: "utf8" });

    const csvStream = parse()
      .on("data", async (row: string[]) => {
        lineNumber++;

        try {
          // For the first row, detect column count
          if (expectedColumns === null) {
            expectedColumns = row.length;
            logger.info(`Detected ${expectedColumns} columns using fast-csv`);
          }

          const wasProcessed = await processRecord(
            row,
            expectedColumns,
            RainbowRecordType,
            outputStream,
            lineNumber,
            existingDb,
            writtenLabels,
            stats,
          );

          if (wasProcessed) {
            processedRecords++;
          }

          // Log progress for large files
          if (lineNumber % progressInterval === 0) {
            logger.info(
              `Processed ${lineNumber} lines, written ${processedRecords} records so far...`,
            );
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          csvStream.destroy();
          fileStream.destroy();
          reject(
            new Error(
              `CSV conversion failed due to invalid data on line ${lineNumber}: ${errorMessage}`,
            ),
          );
        }
      })
      .on("error", (error: Error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      })
      .on("end", () => {
        resolve({ totalLines: lineNumber, processedRecords });
      });

    fileStream
      .on("error", (error: Error) => {
        reject(error);
      })
      .pipe(csvStream);
  });
}

/**
 * Main CSV conversion command with true streaming using fast-csv
 */
export async function convertCsvCommand(options: ConvertCsvCommandOptions): Promise<void> {
  const stats: ConversionStats = {
    totalLines: 0,
    processedRecords: 0,
    filteredExistingLabels: 0,
    filteredDuplicates: 0,
    startTime: new Date(),
  };

  let existingDb: ENSRainbowDB | null = null;

  try {
    const { RainbowRecordType, outputStream, existingDb: db } = await initializeConversion(options);
    existingDb = db;

    const progressInterval = options.progressInterval ?? DEFAULT_PROGRESS_INTERVAL;

    // Process the CSV file
    const { totalLines, processedRecords } = await processCSVFile(
      options.inputFile,
      RainbowRecordType,
      outputStream,
      progressInterval,
      existingDb,
      stats,
    );

    stats.totalLines = totalLines;
    stats.processedRecords = processedRecords;

    // Close output stream
    outputStream.end();

    logger.info(`✅ Processed ${processedRecords} records with streaming fast-csv`);
    logSummary(stats);
    logger.info("✅ CSV conversion completed successfully!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("❌ CSV conversion failed:", errorMessage);
    throw error;
  } finally {
    // Clean up database connection
    if (existingDb) {
      try {
        await existingDb.close();
        logger.info("Closed existing database connection");
      } catch (error) {
        logger.warn(`Failed to close existing database: ${error}`);
      }
    }
  }
}
