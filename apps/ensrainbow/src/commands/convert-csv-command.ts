/**
 * ENSRAINBOW CSV FILE CREATION COMMAND
 *
 * Converts CSV files to .ensrainbow format with fast-csv
 * Supports 1-column (label only) and 2-column (label,labelhash) formats
 */

import { createReadStream, createWriteStream, statSync } from "fs";
import { rmSync } from "fs";
import { join } from "path";
import { type LabelHash, labelHashToBytes } from "@ensnode/ensnode-sdk";
import { parse } from "@fast-csv/parse";
import { labelhash } from "viem";
import { ClassicLevel } from "classic-level";
import ProgressBar from "progress";
import bloomFilters from "bloom-filters";
import { ENSRainbowDB } from "../lib/database.js";
import { logger } from "../utils/logger.js";
import {
  CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION,
  createRainbowProtobufRoot,
} from "../utils/protobuf-schema.js";

/**
 * Simple deduplication database using ClassicLevel directly
 */
class DeduplicationDB {
  private pendingWrites: Map<string, string> = new Map();
  private cache: Map<string, boolean> = new Map();
  private cacheSize: number;
  private bloomFilter: typeof bloomFilters.BloomFilter | null = null;

  constructor(private db: ClassicLevel<string, string>, cacheSize: number = 10000, useBloomFilter: boolean = false, expectedItems: number = 10000000) {
    this.cacheSize = cacheSize;
    
    if (useBloomFilter) {
      // Create Bloom filter with 0.1% false positive rate
      this.bloomFilter = bloomFilters.BloomFilter.create(expectedItems, 0.01);
      logger.info(`Created Bloom filter for ${expectedItems} items (~${(this.bloomFilter.size / 8 / 1024 / 1024).toFixed(2)} MB)`);
    }
  }

  async has(key: string): Promise<boolean> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Check pending writes
    if (this.pendingWrites.has(key)) {
      this.cache.set(key, true);
      return true;
    }

    // Use Bloom filter if available
    if (this.bloomFilter) {
      // If Bloom filter says "not present", we can skip LevelDB check
      if (!this.bloomFilter.has(key)) {
        this.cache.set(key, false);
        return false;
      }
      // Bloom filter says "maybe present" - need to check LevelDB
    }

    // Check database
    try {
      await this.db.get(key);
      this.cache.set(key, true);
      return true;
    } catch (error) {
      this.cache.set(key, false);
      return false;
    }
  }

  async add(key: string, value: string): Promise<void> {
    this.pendingWrites.set(key, value);
    this.cache.set(key, true); // Cache the fact that this key exists
    
    // Add to Bloom filter if available
    if (this.bloomFilter) {
      this.bloomFilter.add(key);
    }
    
    // Check cache size periodically (not on every add)
    this.evictCacheIfNeeded();
    
    // Flush to database periodically (smaller batch to reduce memory usage)
    if (this.pendingWrites.size >= 5000) {
      await this.flush();
    }
  }

  private evictCacheIfNeeded(): void {
    // Limit cache size - only evict when significantly exceeded
    if (this.cache.size > this.cacheSize * 1.2) {
      // Remove oldest 20% of entries
      let toRemove = Math.floor(this.cacheSize * 0.2);
      for (const key of this.cache.keys()) {
        if (toRemove-- <= 0) break;
        this.cache.delete(key);
      }
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
}


/**
 * Sets up a simple progress bar that shows speed without total count.
 */
function setupProgressBar(): ProgressBar {
  return new ProgressBar(
    "Processing CSV [:bar] :current lines - :rate lines/sec",
    {
      complete: "=",
      incomplete: " ",
      width: 40,
      total: 200000000, // Very large total for big files
    },
  );
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
  noDedup?: boolean; // Disable deduplication within CSV file
  cacheSize?: number; // Cache size for deduplication (default: 10000)
  useBloomFilter?: boolean; // Use Bloom filter for faster deduplication (default: false)
  bloomFilterSize?: number; // Expected number of items for Bloom filter (default: 10000000)
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

  // Check file size and warn for very large files
  try {
    const stats = statSync(options.inputFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    logger.info(`Input file size: ${fileSizeMB} MB`);
    
    if (stats.size > 1024 * 1024 * 1024) { // > 1GB
      logger.warn("⚠️  Processing a very large file. This may take significant time and memory.");
      logger.warn("💡 Consider using --existing-db-path to filter out existing labels for better performance.");
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
  dedupDb: DeduplicationDB | null,
  stats: ConversionStats,
  progressBar: ProgressBar | null,
): Promise<{ totalLines: number; processedRecords: number }> {
  let expectedColumns: number | null = null;
  let lineNumber = 0;
  let processedRecords = 0;
  let lastLoggedLine = 0; // Track last logged line to avoid duplicate logs
  const startTime = Date.now(); // Track start time for overall processing
  let lastLogTime = Date.now(); // Track time of last log for chunk timing
  
  // LevelDB-based deduplication: Uses temporary database to avoid RAM limits

  const fileStream = createReadStream(inputFile, { encoding: "utf8" });

  return new Promise((resolve, reject) => {
    let pendingCount = 0;
    const MAX_PENDING = 100; // Smaller limit to reduce memory

    const csvStream = parse()
      .on("data", (row: string[]) => {
        lineNumber++;

        // For the first row, detect column count
        if (expectedColumns === null) {
          expectedColumns = row.length;
          logger.info(`Detected ${expectedColumns} columns using fast-csv`);
        }

        // Log progress synchronously when line is read (not in async callback)
        // This ensures logs appear at the correct intervals
        if (lineNumber % progressInterval === 0 && lineNumber !== lastLoggedLine) {
          const currentTime = Date.now();
          const chunkTime = currentTime - lastLogTime; // Time for this 10k chunk
          const totalElapsed = currentTime - startTime; // Total time since start
          const chunkTimeSeconds = (chunkTime / 1000).toFixed(2);
          const totalTimeSeconds = (totalElapsed / 1000).toFixed(2);
          const linesPerSecond = ((progressInterval / chunkTime) * 1000).toFixed(0);
          
          lastLoggedLine = lineNumber;
          lastLogTime = currentTime;
          
          // Note: processedRecords may be slightly behind due to async processing
          logger.info(
            `Processed ${lineNumber} lines, written ${processedRecords} records | ` +
            `Chunk: ${chunkTimeSeconds}s (${linesPerSecond} lines/sec) | ` +
            `Total: ${totalTimeSeconds}s`
          );
        }

        // Backpressure: pause if too many pending
        if (pendingCount >= MAX_PENDING) {
          csvStream.pause();
        }

        pendingCount++;
        processRecord(
          row,
          expectedColumns,
          RainbowRecordType,
          outputStream,
          lineNumber,
          existingDb,
          dedupDb,
          stats,
        ).then((wasProcessed) => {
          if (wasProcessed) {
            processedRecords++;
          }
          
          // Update progress bar every 1000 lines
          if (lineNumber % 1000 === 0 && progressBar) {
            progressBar.tick(1000);
            progressBar.curr = lineNumber;
          }
          
          pendingCount--;
          
          // Resume when under threshold
          if (csvStream.isPaused() && pendingCount < MAX_PENDING / 2) {
            csvStream.resume();
          }
        }).catch((error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          csvStream.destroy();
          fileStream.destroy();
          reject(
            new Error(
              `CSV conversion failed due to invalid data on line ${lineNumber}: ${errorMessage}`,
            ),
          );
        });
      })
      .on("error", (error: Error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      })
      .on("end", async () => {
        // Wait for all pending to complete
        while (pendingCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        const dedupStatus = dedupDb ? "LevelDB deduplication completed" : "Deduplication disabled";
        logger.info(dedupStatus);
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
  let dedupDb: DeduplicationDB | null = null;
  let tempDedupDir: string | null = null;

  try {
    const { RainbowRecordType, outputStream, existingDb: db } = await initializeConversion(options);
    existingDb = db;

    // Create temporary deduplication database (if not disabled)
    if (!options.noDedup) {
      tempDedupDir = join(process.cwd(), 'temp-dedup-' + Date.now());
      logger.info(`Creating temporary deduplication database at: ${tempDedupDir}`);
      const tempDb = new ClassicLevel<string, string>(tempDedupDir, {
        keyEncoding: 'utf8',
        valueEncoding: 'utf8',
        createIfMissing: true,
      });
      await tempDb.open();
      dedupDb = new DeduplicationDB(
        tempDb, 
        options.cacheSize ?? 10000,
        options.useBloomFilter ?? false,
        options.bloomFilterSize ?? 10000000
      );
    } else {
      logger.info("Deduplication disabled - processing all records");
    }

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
              const dedupStatus = options.noDedup ? "dedup disabled" : "LevelDB dedup active";
              logger.info(
                `✅ Completed processing ${totalLines.toLocaleString()} lines, wrote ${processedRecords.toLocaleString()} records (${dedupStatus})`,
              );
            }

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
