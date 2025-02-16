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
  const db = await ENSRainbowDB.create(options.dataDir);

  try {
    // Check if there's an incomplete ingestion
    if (await db.isIngestionInProgress()) {
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
    let batch = db.batch();
    let batchSize = 0;
    let processedRecords = 0;
    let invalidRecords = 0;
    const MAX_BATCH_SIZE = 10000;

    logger.info("Ingesting data into LevelDB...");

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

      batch.put(record.labelHash, record.label);
      batchSize++;
      processedRecords++;

      if (batchSize >= MAX_BATCH_SIZE) {
        await batch.write();
        batch = db.batch();
        batchSize = 0;
      }
      bar.tick();
    }

    // Write any remaining entries
    if (batchSize > 0) {
      await batch.write();
    }

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

    // Store the count of rainbow records
    await db.setRainbowRecordCount(processedRecords);
    logger.info(`Updated rainbow record count in database: ${processedRecords}`);

    // Verify the count matches what we stored
    const storedCount = await db.getRainbowRecordCount();
    if (storedCount !== processedRecords) {
      logger.error(`Count mismatch: stored=${storedCount}, actual=${processedRecords}`);
      throw new Error("Count verification failed");
    }

    // Clear the ingestion marker since we completed successfully
    await db.clearIngestionMarker();

    logger.info("Data ingestion and count verification complete!");
  } catch (error) {
    // If anything goes wrong, make sure to clear the ingestion marker
    // so the database can be used again
    await db.clearIngestionMarker();
    throw error;
  } finally {
    await db.close();
  }
}
