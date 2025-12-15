/**
 * ENSRAINBOW CSV FILE CREATION COMMAND
 *
 * Converts CSV files to .ensrainbow format with fast-csv
 * Supports 1-column (label only) and 2-column (label,labelhash) formats
 */

import { createReadStream, createWriteStream, rmSync, statSync } from "fs";
import { join } from "path";

import { parse } from "@fast-csv/parse";
import { ClassicLevel } from "classic-level";
import ProgressBar from "progress";
import { labelhash } from "viem";

import { type LabelHash, labelHashToBytes } from "@ensnode/ensnode-sdk";

import { ENSRainbowDB } from "../lib/database.js";
import { logger } from "../utils/logger.js";
import {
  CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
  createRainbowProtobufRoot,
} from "../utils/protobuf-schema.js";

/**
 * Estimate memory usage of a Map (rough approximation)
 */
function estimateMapMemory(map: Map<string, any>): number {
  let total = 0;
  for (const [key, value] of map) {
    // Rough estimate: key size + value size + Map overhead (48 bytes per entry)
    total += key.length * 2 + (typeof value === "string" ? value.length * 2 : 8) + 48;
  }
  return total;
}

/**
 * Simple deduplication database using ClassicLevel directly
 */
class DeduplicationDB {
  private pendingWrites: Map<string, string> = new Map();

  constructor(private db: ClassicLevel<string, string>) {
    // No in-memory cache - LevelDB has its own internal cache
  }

  async has(key: string): Promise<boolean> {
    // Check pending writes first (not yet flushed to DB)
    if (this.pendingWrites.has(key)) {
      return true;
    }

    // Check database (LevelDB has its own internal cache)
    try {
      await this.db.get(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async add(key: string, value: string): Promise<void> {
    this.pendingWrites.set(key, value);

    // Flush frequently to keep pendingWrites small
    if (this.pendingWrites.size >= 1000) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.pendingWrites.size === 0) return;

    const batch = this.db.batch();
    for (const [key, value] of this.pendingWrites) {
      batch.put(key, value);
    }
    await batch.write();
    this.pendingWrites.clear();

    // Hint to garbage collector after large batch
    if (global.gc) {
      global.gc();
    }
  }

  async close(): Promise<void> {
    await this.flush();
    await this.db.close();
  }

  getMemoryStats(): {
    pendingWrites: number;
    cache: number;
    pendingWritesMB: number;
    cacheMB: number;
  } {
    return {
      pendingWrites: this.pendingWrites.size,
      cache: 0, // Cache disabled - using LevelDB's internal cache
      pendingWritesMB: estimateMapMemory(this.pendingWrites) / 1024 / 1024,
      cacheMB: 0,
    };
  }
}

/**
 * Sets up a simple progress bar that shows speed without total count.
 */
function setupProgressBar(): ProgressBar {
  return new ProgressBar("Processing CSV [:bar] :current lines - :rate lines/sec", {
    complete: "=",
    incomplete: " ",
    width: 40,
    total: 200000000, // Very large total for big files
  });
}

/**
 * Options for CSV conversion command
 */
export interface ConvertCsvCommandOptions {
  inputFile: string;
  outputFile: string;
  labelSetId: string;
  labelSetVersion: number;
  progressInterval?: number;
  existingDbPath?: string; // Path to existing ENSRainbow database to check for existing labels
  silent?: boolean; // Disable progress bar for tests
}

// Configuration constants
const DEFAULT_PROGRESS_INTERVAL = 50000; // Increased from 10k to 50k to reduce logging load

interface ConversionStats {
  totalLines: number;
  processedRecords: number;
  filteredExistingLabels: number;
  filteredDuplicates: number;
  outputBackpressureEvents: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Setup output stream for writing protobuf
 */
function setupWriteStream(outputFile: string) {
  // Use very small highWaterMark (16KB) to trigger backpressure early and frequently
  // This prevents unbounded buffer growth when writes are faster than disk I/O
  // Smaller buffer = more frequent backpressure = better memory control
  return createWriteStream(outputFile, {
    highWaterMark: 16 * 1024, // 16KB buffer - very small to catch backpressure early
  });
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
  logger.info(`Output backpressure events: ${stats.outputBackpressureEvents}`);
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

  // Check file size and warn for very large files
  try {
    const stats = statSync(options.inputFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    logger.info(`Input file size: ${fileSizeMB} MB`);

    if (stats.size > 1024 * 1024 * 1024) {
      // > 1GB
      logger.warn("⚠️  Processing a very large file - using SEQUENTIAL mode.");
      logger.warn("💡 Use --existing-db-path to filter existing labels and speed up processing.");
    }
  } catch (error) {
    logger.warn(`Could not determine file size: ${error}`);
  }

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
    return {
      labelhash: Buffer.from(labelHashBytes),
      label: label,
    };
  } else {
    // Two columns: validate and use provided hash
    // Trim whitespace from hash (metadata), but preserve label as-is
    const providedHash = String(row[1]).trim();
    if (providedHash === "") {
      throw new Error("LabelHash cannot be empty");
    }
    const maybeLabelHash = providedHash.startsWith("0x") ? providedHash : `0x${providedHash}`;
    try {
      const labelHash = labelHashToBytes(maybeLabelHash as LabelHash);
      return {
        labelhash: Buffer.from(labelHash),
        label: label,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid labelHash: ${errorMessage}`);
    }
  }
}

/**
 * Process a single CSV record with LevelDB-based deduplication
 */
async function processRecord(
  row: string[],
  expectedColumns: number,
  RainbowRecordType: any,
  outputStream: NodeJS.WritableStream,
  lineNumber: number,
  existingDb: ENSRainbowDB | null,
  dedupDb: DeduplicationDB | null,
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

  // Check if labelhash already exists in the existing database
  if (existingDb) {
    const existsInDb = await checkLabelHashExists(existingDb, labelHashBytes);
    if (existsInDb) {
      stats.filteredExistingLabels++;
      return false; // Skip this record
    }
  }

  // Check if label is a duplicate within this conversion using LevelDB (if enabled)
  if (dedupDb) {
    const existsInDedupDb = await dedupDb.has(label);
    if (existsInDedupDb) {
      stats.filteredDuplicates++;
      return false; // Skip this record
    }

    // Add label to deduplication database
    await dedupDb.add(label, "");
  }

  // Create protobuf message and write with backpressure handling
  const recordMessage = RainbowRecordType.fromObject(rainbowRecord);
  const buffer = Buffer.from(RainbowRecordType.encodeDelimited(recordMessage).finish());

  // Check if write returns false (buffer full) - if so, wait for drain
  const canContinue = outputStream.write(buffer);
  if (!canContinue) {
    // Buffer is full - signal backpressure
    stats.outputBackpressureEvents++;
    // Wait for drain event before continuing
    // Note: The CSV stream should be paused by the caller when backpressure is detected
    await new Promise<void>((resolve) => {
      outputStream.once("drain", resolve);
    });
  }

  return true; // Record was processed
}

/**
 * Process the entire CSV file - COMPLETELY SEQUENTIAL (one row at a time)
 */
async function processCSVFile(
  inputFile: string,
  RainbowRecordType: any,
  outputStream: NodeJS.WritableStream,
  progressInterval: number,
  existingDb: ENSRainbowDB | null,
  dedupDb: DeduplicationDB | null,
  stats: ConversionStats,
  progressBar: ProgressBar | null,
): Promise<{ totalLines: number; processedRecords: number }> {
  let expectedColumns: number | null = null;
  let lineNumber = 0;
  let processedRecords = 0;
  let lastLoggedLine = 0;
  const startTime = Date.now();
  let lastLogTime = Date.now();

  const fileStream = createReadStream(inputFile, { encoding: "utf8" });

  return new Promise((resolve, reject) => {
    const csvStream = parse(); // Sequential processing via pause/resume
    let isProcessing = false;
    let streamEnded = false;

    const checkAndResolve = () => {
      if (streamEnded && !isProcessing) {
        logger.info(`Sequential processing complete`);
        resolve({ totalLines: lineNumber, processedRecords });
      }
    };

    csvStream
      .on("data", async (row: string[]) => {
        // PAUSE IMMEDIATELY - process one row at a time
        csvStream.pause();
        isProcessing = true;

        lineNumber++;

        try {
          // Skip empty rows (no columns or all empty strings)
          const isEmptyRow = row.length === 0 || row.every((cell) => cell === "");
          if (isEmptyRow) {
            isProcessing = false;
            csvStream.resume();
            checkAndResolve();
            return;
          }

          // Detect column count on first non-empty row
          if (expectedColumns === null) {
            expectedColumns = row.length;
            logger.info(`Detected ${expectedColumns} columns - SEQUENTIAL processing mode`);
          }

          // Log progress (less frequently to avoid logger crashes)
          if (lineNumber % progressInterval === 0 && lineNumber !== lastLoggedLine) {
            const currentTime = Date.now();
            const chunkTime = currentTime - lastLogTime;
            const totalElapsed = currentTime - startTime;
            const chunkTimeSeconds = (chunkTime / 1000).toFixed(2);
            const totalTimeSeconds = (totalElapsed / 1000).toFixed(2);
            const linesPerSecond = ((progressInterval / chunkTime) * 1000).toFixed(0);

            lastLoggedLine = lineNumber;
            lastLogTime = currentTime;

            const memUsage = process.memoryUsage();
            const memInfo = `RSS=${(memUsage.rss / 1024 / 1024).toFixed(0)}MB, Heap=${(memUsage.heapUsed / 1024 / 1024).toFixed(0)}MB`;

            let dedupInfo = "";
            if (dedupDb) {
              const dedupStats = dedupDb.getMemoryStats();
              dedupInfo = ` | Dedup: ${dedupStats.pendingWrites}/${dedupStats.cache}`;
            }

            // Use console.log instead of logger to avoid worker thread issues
            console.log(
              `[${new Date().toISOString()}] Line ${lineNumber}, written ${processedRecords} | ` +
                `${linesPerSecond} lines/sec | ${memInfo}${dedupInfo}`,
            );
          }

          // Process this one record
          const wasProcessed = await processRecord(
            row,
            expectedColumns,
            RainbowRecordType,
            outputStream,
            lineNumber,
            existingDb,
            dedupDb,
            stats,
          );

          if (wasProcessed) {
            processedRecords++;
          }

          // Update progress bar
          if (lineNumber % 1000 === 0 && progressBar) {
            progressBar.tick(1000);
            progressBar.curr = lineNumber;
          }

          // Done processing - resume for next row
          isProcessing = false;
          csvStream.resume();
          checkAndResolve();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          csvStream.destroy();
          fileStream.destroy();
          reject(new Error(`Failed on line ${lineNumber}: ${errorMessage}`));
        }
      })
      .on("error", (error: Error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      })
      .on("end", () => {
        streamEnded = true;
        checkAndResolve();
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
    outputBackpressureEvents: 0,
    startTime: new Date(),
  };

  let existingDb: ENSRainbowDB | null = null;
  let dedupDb: DeduplicationDB | null = null;
  let tempDedupDir: string | null = null;

  try {
    const { RainbowRecordType, outputStream, existingDb: db } = await initializeConversion(options);
    existingDb = db;

    // Create temporary deduplication database
    tempDedupDir = join(process.cwd(), "temp-dedup-" + Date.now());
    logger.info(`Creating temporary deduplication database at: ${tempDedupDir}`);
    const tempDb = new ClassicLevel<string, string>(tempDedupDir, {
      keyEncoding: "utf8",
      valueEncoding: "utf8",
      createIfMissing: true,
      // Aggressive memory limits
      cacheSize: 2 * 1024 * 1024, // 2MB block cache (minimal)
      writeBufferSize: 4 * 1024 * 1024, // 4MB write buffer (minimal)
      maxOpenFiles: 100, // Limit open files
      compression: false, // Disable compression to reduce CPU/memory
    });
    await tempDb.open();
    dedupDb = new DeduplicationDB(tempDb);

    const progressInterval = options.progressInterval ?? DEFAULT_PROGRESS_INTERVAL;

    // Set up progress bar (only if not silent)
    const progressBar = options.silent ? null : setupProgressBar();

    // Process the CSV file
    const { totalLines, processedRecords } = await processCSVFile(
      options.inputFile,
      RainbowRecordType,
      outputStream,
      progressInterval,
      existingDb,
      dedupDb,
      stats,
      progressBar,
    );

    stats.totalLines = totalLines;
    stats.processedRecords = processedRecords;

    // Log final progress for large files
    if (totalLines > 10_000) {
      logger.info(
        `✅ Completed processing ${totalLines.toLocaleString()} lines, wrote ${processedRecords.toLocaleString()} records (LevelDB dedup active)`,
      );
    }

    // Close output stream
    outputStream.end();

    logger.info(`✅ Processed ${processedRecords} records with streaming fast-csv`);
    logSummary(stats);
    logger.info("✅ CSV conversion completed successfully!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ CSV conversion failed: ${errorMessage}`);
    throw error;
  } finally {
    // Clean up deduplication database
    if (dedupDb) {
      try {
        await dedupDb.close();
        logger.info("Closed deduplication database");
      } catch (error) {
        logger.warn(`Failed to close deduplication database: ${error}`);
      }
    }

    // Clean up existing database connection
    if (existingDb) {
      try {
        await existingDb.close();
        logger.info("Closed existing database connection");
      } catch (error) {
        logger.warn(`Failed to close existing database: ${error}`);
      }
    }

    // Remove temporary deduplication database directory
    if (tempDedupDir) {
      try {
        rmSync(tempDedupDir, { recursive: true, force: true });
        logger.info(`Removed temporary deduplication database: ${tempDedupDir}`);
      } catch (error) {
        logger.warn(`Failed to remove temporary deduplication database: ${error}`);
      }
    }
  }
}
