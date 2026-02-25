/**
 * ENSRAINBOW CSV FILE CREATION COMMAND
 *
 * Converts single-column CSV files (one label per line) to .ensrainbow format with fast-csv
 */

import { once } from "node:events";
import { createReadStream, createWriteStream, rmSync, statSync, type WriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { dirname, join } from "node:path";

import { parse } from "@fast-csv/parse";
import { ClassicLevel } from "classic-level";
import ProgressBar from "progress";
import { labelhash } from "viem";

import { type LabelSetId, labelHashToBytes } from "@ensnode/ensnode-sdk";

import { ENSRainbowDB } from "../lib/database.js";
import { logger } from "../utils/logger.js";
import {
  CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
  createRainbowProtobufRoot,
} from "../utils/protobuf-schema.js";
import type { RainbowRecord } from "../utils/rainbow-record.js";

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
    } catch (error: unknown) {
      // Only treat a missing-key error as "not found";
      // rethrow I/O, corruption, LEVEL_LOCKED, or other unexpected errors
      if (
        error != null &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "LEVEL_NOT_FOUND"
      ) {
        return false;
      }
      throw error;
    }
  }

  async add(key: string, value: string): Promise<void> {
    this.pendingWrites.set(key, value);

    // Flush frequently to keep pendingWrites small
    if (this.pendingWrites.size >= DEDUP_PENDING_WRITES_FLUSH_THRESHOLD) {
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
    total: PROGRESS_BAR_LARGE_TOTAL,
  });
}

/**
 * Options for CSV conversion command
 */
export interface ConvertCsvCommandCliArgs {
  "input-file": string;
  "output-file"?: string;
  "label-set-id": LabelSetId;
  "progress-interval"?: number;
  "existing-db-path"?: string;
  silent?: boolean;
}

export interface ConvertCsvCommandOptions {
  inputFile: string;
  outputFile?: string; // Optional - will be generated if not provided
  labelSetId: string;
  progressInterval?: number;
  existingDbPath?: string; // Path to existing ENSRainbow database to check for existing labels and determine next version
  silent?: boolean; // Disable progress bar for tests
}

// Configuration constants
const DEFAULT_PROGRESS_INTERVAL = 50000; // Increased from 10k to 50k to reduce logging load
const PROGRESS_BAR_LARGE_TOTAL = 300_000_000; // Very large total for progress bar to handle big files
const DEDUP_PENDING_WRITES_FLUSH_THRESHOLD = 1000; // Flush deduplication DB when pending writes reach this count
const OUTPUT_STREAM_BUFFER_SIZE = 16 * 1024; // 16KB buffer - very small to catch backpressure early
const LARGE_FILE_SIZE_THRESHOLD_MB = 1024; // 1GB - warn user about very large files
const PROGRESS_BAR_UPDATE_INTERVAL = 1000; // Update progress bar every N lines

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
    highWaterMark: OUTPUT_STREAM_BUFFER_SIZE,
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Error while checking if labelhash exists in ENSRainbow database: ${errorMessage}`,
    );
    throw error;
  }
}

/**
 * Get the label set version and open database connection if needed
 * Returns both the version and the open database connection (if opened) to avoid redundant opens
 */
async function getLabelSetVersionAndDatabase(
  existingDbPath: string | undefined,
  labelSetId: string,
): Promise<{ version: number; existingDb: ENSRainbowDB | null }> {
  if (!existingDbPath) {
    return { version: 0, existingDb: null };
  }

  try {
    logger.info(`Opening existing database to determine next label set version: ${existingDbPath}`);
    const existingDb = await ENSRainbowDB.open(existingDbPath);
    const labelSet = await existingDb.getLabelSet();

    // Validate that the label set ID matches
    if (labelSet.labelSetId !== labelSetId) {
      await existingDb.close();
      throw new Error(
        `Label set ID mismatch! Database label set id: ${labelSet.labelSetId}, provided label set id: ${labelSetId}`,
      );
    }

    const nextVersion = labelSet.highestLabelSetVersion + 1;
    logger.info(
      `Determined next label set version: ${nextVersion} (current highest: ${labelSet.highestLabelSetVersion})`,
    );
    // Return the open database connection instead of closing it
    return { version: nextVersion, existingDb };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to determine label set version from existing database at ${existingDbPath}: ${errorMessage}`,
    );
  }
}

/**
 * Generate output file name from label set ID and version
 */
function generateOutputFileName(labelSetId: string, labelSetVersion: number): string {
  return `${labelSetId}_${labelSetVersion}.ensrainbow`;
}

/**
 * Initialize conversion setup and logging
 */
async function initializeConversion(
  options: ConvertCsvCommandOptions,
  labelSetVersion: number,
  outputFile: string,
  existingDb: ENSRainbowDB | null,
) {
  logger.info("Starting conversion from CSV to .ensrainbow format...");
  logger.info(`Input file: ${options.inputFile}`);
  logger.info(`Output file: ${outputFile}`);
  logger.info(`Label set id: ${options.labelSetId}`);
  logger.info(`Label set version: ${labelSetVersion}`);

  // Check file size and warn for very large files
  try {
    const stats = statSync(options.inputFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    logger.info(`Input file size: ${fileSizeMB} MB`);

    if (stats.size > LARGE_FILE_SIZE_THRESHOLD_MB * 1024 * 1024) {
      logger.warn("⚠️  Processing a very large file - using SEQUENTIAL mode.");
    }
  } catch (error) {
    logger.warn(`Could not determine file size: ${error}`);
  }

  // Log if using existing database for filtering
  if (existingDb) {
    logger.info("Using existing database connection for label filtering");
  }

  const { RainbowRecordType, RainbowRecordCollectionType } = createRainbowProtobufRoot();
  const outputStream = setupWriteStream(outputFile);

  writeHeader(outputStream, RainbowRecordCollectionType, options.labelSetId, labelSetVersion);

  logger.info("Reading and processing CSV file line by line with streaming...");

  return { RainbowRecordType, outputStream, existingDb };
}

/** Tuple representing a single-column CSV row (label only). */
type SingleColumnRow = [string];

/**
 * Create rainbow record from a single-column CSV row (label only).
 * Labelhashes are always computed deterministically from labels.
 */
function createRainbowRecord(row: SingleColumnRow): RainbowRecord {
  const label = row[0];
  const labelHashBytes = labelHashToBytes(labelhash(label));
  return {
    labelHash: labelHashBytes,
    label,
  };
}

/**
 * Process a single CSV record with LevelDB-based deduplication
 */
async function processRecord(
  row: SingleColumnRow,
  RainbowRecordType: any,
  outputStream: NodeJS.WritableStream,
  existingDb: ENSRainbowDB | null,
  dedupDb: DeduplicationDB,
  stats: ConversionStats,
): Promise<boolean> {
  const rainbowRecord = createRainbowRecord(row);
  const label = rainbowRecord.label;
  const labelHashBytes = Buffer.from(rainbowRecord.labelHash);

  // Check if labelhash already exists in the existing database
  if (existingDb) {
    const existsInDb = await checkLabelHashExists(existingDb, labelHashBytes);
    if (existsInDb) {
      stats.filteredExistingLabels++;
      return false; // Skip this record
    }
  }

  // Check if label is a duplicate within this conversion using LevelDB
  const existsInDedupDb = await dedupDb.has(label);
  if (existsInDedupDb) {
    stats.filteredDuplicates++;
    return false; // Skip this record
  }

  // Add label to deduplication database
  await dedupDb.add(label, "");

  // Create protobuf message and write with backpressure handling
  // Map RainbowRecord (labelHash) to protobuf format (labelhash)
  const recordMessage = RainbowRecordType.fromObject({
    labelhash: Buffer.from(rainbowRecord.labelHash),
    label: rainbowRecord.label,
  });
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
  dedupDb: DeduplicationDB,
  stats: ConversionStats,
  progressBar: ProgressBar | null,
): Promise<{ totalLines: number; processedRecords: number }> {
  let lineNumber = 0;
  let processedRecords = 0;
  let lastLoggedLine = 0;
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

          if (row.length !== 1) {
            throw new Error(
              `Expected 1 column (label only), but found ${row.length} columns. Multi-column CSV formats are not supported.`,
            );
          }

          const singleColumnRow = row as SingleColumnRow;

          // Log progress (less frequently to avoid logger crashes)
          if (lineNumber % progressInterval === 0 && lineNumber !== lastLoggedLine) {
            const currentTime = Date.now();
            const chunkTime = currentTime - lastLogTime;
            const linesPerSecond = ((progressInterval / chunkTime) * 1000).toFixed(0);

            lastLoggedLine = lineNumber;
            lastLogTime = currentTime;

            const memUsage = process.memoryUsage();
            const memInfo = `RSS=${(memUsage.rss / 1024 / 1024).toFixed(0)}MB, Heap=${(memUsage.heapUsed / 1024 / 1024).toFixed(0)}MB`;

            const dedupStats = dedupDb.getMemoryStats();
            const dedupInfo = ` | Dedup: ${dedupStats.pendingWrites}/${dedupStats.cache}`;

            // Use console.log instead of logger to avoid worker thread issues
            console.log(
              `[${new Date().toISOString()}] Line ${lineNumber}, written ${processedRecords} | ` +
                `${linesPerSecond} lines/sec | ${memInfo}${dedupInfo}`,
            );
          }

          // Process this one record
          const wasProcessed = await processRecord(
            singleColumnRow,
            RainbowRecordType,
            outputStream,
            existingDb,
            dedupDb,
            stats,
          );

          if (wasProcessed) {
            processedRecords++;
          }

          // Update progress bar
          if (lineNumber % PROGRESS_BAR_UPDATE_INTERVAL === 0 && progressBar) {
            progressBar.tick(PROGRESS_BAR_UPDATE_INTERVAL);
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
  // Get label set version from existing database or default to 0
  // This also opens the database if needed, and we'll reuse that connection
  const { version: labelSetVersion, existingDb: openedDb } = await getLabelSetVersionAndDatabase(
    options.existingDbPath,
    options.labelSetId,
  );

  // Generate output file name if not provided
  const outputFile =
    options.outputFile ?? generateOutputFileName(options.labelSetId, labelSetVersion);

  const stats: ConversionStats = {
    totalLines: 0,
    processedRecords: 0,
    filteredExistingLabels: 0,
    filteredDuplicates: 0,
    outputBackpressureEvents: 0,
    startTime: new Date(),
  };

  let existingDb: ENSRainbowDB | null = openedDb;
  let dedupDb: DeduplicationDB | undefined;
  let tempDb: ClassicLevel<string, string> | undefined;
  let temporaryDedupDir: string | null = null;
  let outputStream: WriteStream | null = null;

  try {
    const {
      RainbowRecordType,
      outputStream: stream,
      existingDb: db,
    } = await initializeConversion(options, labelSetVersion, outputFile, existingDb);
    outputStream = stream;
    existingDb = db;

    // Create temporary deduplication database in the same directory as the output file
    // This ensures it's on the same filesystem/disk as the output, avoiding space issues
    const outputDir = dirname(outputFile);
    temporaryDedupDir = join(outputDir, `temp-dedup-${Date.now()}`);
    logger.info(`Creating temporary deduplication database at: ${temporaryDedupDir}`);
    tempDb = new ClassicLevel<string, string>(temporaryDedupDir, {
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
    // Clean up output stream if it wasn't gracefully ended (error path).
    // After end(), writable is false, so this only triggers on error paths.
    if (outputStream?.writable) {
      const outputPath = (outputStream as WriteStream & { path?: string }).path ?? outputFile;
      try {
        // Suppress errors from in-flight writes whose async I/O completes
        // after destroy (e.g. "Cannot call write after a stream was destroyed").
        // On error paths the output file is incomplete anyway.
        outputStream.on("error", () => {});
        outputStream.destroy();
        // Wait for the OS file handle to be released before unlinking.
        // destroy() is asynchronous; the handle is only freed on the 'close' event.
        await once(outputStream, "close");
        logger.info("Destroyed output stream on error path");
      } catch (error) {
        logger.warn(`Failed to destroy output stream: ${error}`);
      }
      try {
        await unlink(outputPath);
        logger.info("Removed partial output file on error path");
      } catch (unlinkErr: unknown) {
        const code = (unlinkErr as NodeJS.ErrnoException).code;
        if (code !== "ENOENT" && code !== "EPERM" && code !== "EBUSY") {
          logger.warn(`Failed to remove partial output file: ${unlinkErr}`);
        }
      }
    }

    // Clean up deduplication database - close the wrapper first
    if (dedupDb !== undefined) {
      try {
        await dedupDb.close();
        logger.info("Closed deduplication database");
      } catch (error) {
        logger.warn(`Failed to close deduplication database: ${error}`);
      }
    }

    // Also ensure tempDb is closed directly if dedupDb.close() didn't handle it
    // This is a safety measure in case dedupDb.close() failed or didn't fully close
    if (tempDb !== undefined) {
      try {
        await tempDb.close();
        logger.info("Closed temporary database directly");
      } catch (error) {
        // Database might already be closed, which is fine
        logger.warn(
          `Failed to close temporary database directly (may already be closed): ${error}`,
        );
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
    if (temporaryDedupDir) {
      try {
        rmSync(temporaryDedupDir, { recursive: true, force: true });
        logger.info(`Removed temporary deduplication database: ${temporaryDedupDir}`);
      } catch (error) {
        logger.warn(`Failed to remove temporary deduplication database: ${error}`);
      }
    }
  }
}
