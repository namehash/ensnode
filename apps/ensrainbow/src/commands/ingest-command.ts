import { createReadStream } from "fs";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import ProgressBar from "progress";

import { ENSRainbowDB } from "../lib/database";
import { logger } from "../utils/logger";
import { buildRainbowRecord } from "../utils/rainbow-record";

export interface IngestCommandOptions {
  inputFile: string;
  dataDir: string;
  concurrency?: number; // Added concurrency option
}

// Total number of expected records in the ENS rainbow table SQL dump
// This number represents the count of unique label-labelhash pairs
// as of January 30, 2024 from the Graph Protocol's ENS rainbow tables
// Source file: ens_names.sql.gz
// SHA256: a6316b1e7770b1f3142f1f21d4248b849a5c6eb998e3e66336912c9750c41f31
// Note: The input file contains one known invalid record at line 10878
// where the labelhash value is literally "hash". This record is skipped
// during ingestion since it would be unreachable through the ENS Subgraph anyway.
// See: https://github.com/namehash/ensnode/issues/140
const TOTAL_EXPECTED_RECORDS = 133_856_894;

export async function ingestCommand(options: IngestCommandOptions): Promise<void> {
  // Set default concurrency if not provided
  const concurrency = options.concurrency || 4;

  const db = await ENSRainbowDB.create(options.dataDir);

  try {
    // Check if there's an unfinished ingestion
    if (await db.isIngestionUnfinished()) {
      const errorMessage =
        "Database is in an incomplete state! " +
        "An ingestion was started but not completed successfully.\n" +
        "To fix this:\n" +
        "1. Delete the data directory\n" +
        "2. Run the ingestion command again: ensrainbow ingest <input-file>";
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Mark ingestion as started
    await db.markIngestionStarted();

    const bar = new ProgressBar(
      "Processing [:bar] :current/:total lines (:percent) - :rate lines/sec - :etas remaining",
      {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: TOTAL_EXPECTED_RECORDS,
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
    const batches = Array(concurrency)
      .fill(null)
      .map(() => db.batch());
    const batchSizes = Array(concurrency).fill(0);
    let batchIndex = 0;
    let processedRecords = 0;
    let invalidRecords = 0;
    const MAX_BATCH_SIZE = 30_000;

    // Array to hold pending write promises
    const pendingWrites = [];

    logger.info(`Ingesting data into LevelDB with ${concurrency} parallel writers...`);

    // Function to write a batch and return a new one
    const writeBatch = async (index) => {
      const batchToWrite = batches[index];
      batches[index] = db.batch();
      batchSizes[index] = 0;

      // Return the write promise
      return batchToWrite.write();
    };

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

      // Add record to current batch
      batches[batchIndex].put(record.labelHash, record.label);
      batchSizes[batchIndex]++;
      processedRecords++;

      // If current batch is full, write it asynchronously
      if (batchSizes[batchIndex] >= MAX_BATCH_SIZE) {
        const writePromise = writeBatch(batchIndex);
        pendingWrites.push(writePromise);

        // Clean up completed writes to prevent memory issues
        if (pendingWrites.length > concurrency * 2) {
          await Promise.all(pendingWrites.splice(0, concurrency));
        }
      }

      // Move to next batch for round-robin distribution
      batchIndex = (batchIndex + 1) % concurrency;

      bar.tick();
    }

    // Write any remaining entries in all batches
    for (let i = 0; i < concurrency; i++) {
      if (batchSizes[i] > 0) {
        pendingWrites.push(writeBatch(i));
      }
    }

    // Wait for all pending writes to complete
    await Promise.all(pendingWrites);

    logger.info("\nData ingestion complete!");

    // Validate the number of processed records
    if (processedRecords !== TOTAL_EXPECTED_RECORDS) {
      logger.error(
        `Error: Expected ${TOTAL_EXPECTED_RECORDS} records but processed ${processedRecords}`,
      );
    } else {
      console.log(`Successfully ingested all ${processedRecords} records`);
    }

    if (invalidRecords > 0) {
      logger.error(`Found ${invalidRecords} records with invalid hashes during processing`);
    }

    // Run count as second phase to verify the number of unique records in the database.
    // While processedRecords tells us how many records we ingested, we need to count
    // the actual database entries to confirm how many unique label-labelhash pairs exist,
    // as the input data could potentially contain duplicates.
    logger.info("\nStarting rainbow record counting phase...");
    await db.countRainbowRecords();

    // Mark ingestion as finished since we completed successfully
    await db.markIngestionFinished();

    logger.info("Data ingestion and count verification complete!");
  } finally {
    await db.close();
  }
}
