import { createReadStream } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import ProgressBar from "progress";
import { ByteArray, labelhash } from "viem";
import { initializeDatabase } from "../lib/database.js";
import { byteArraysEqual } from "../utils/byte-utils.js";
import { labelHashToBytes } from "../utils/label-utils.js";
import { LogLevel, createLogger } from "../utils/logger.js";
import { buildRainbowRecord } from "../utils/rainbow-record.js";

export interface IngestCommandOptions {
  inputFile: string;
  dataDir: string;
  validateHashes?: boolean;
  logLevel?: LogLevel;
}

// Total number of expected records in the ENS rainbow table SQL dump
const TOTAL_EXPECTED_RECORDS = 133_856_894;

export async function ingestCommand(options: IngestCommandOptions): Promise<void> {
  const log = createLogger(options.logLevel);
  const db = initializeDatabase(options.dataDir);

  // Clear existing database before starting
  log.info("Clearing existing database...");
  await db.clear();
  log.info("Database cleared.");

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

  log.info("Loading data into LevelDB...");

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

      if (options.validateHashes) {
        const computedHash = labelHashToBytes(labelhash(record.label));
        const storedHash = record.labelHash;
        if (!byteArraysEqual(computedHash, storedHash)) {
          log.warn(
            `Hash mismatch for label "${record.label}": stored=${storedHash}, computed=${computedHash}`,
          );
          invalidRecords++;
          continue;
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        log.warn(
          `Skipping invalid record: ${e.message} - this record would be unreachable via ENS Subgraph`,
        );
      } else {
        log.warn(`Unknown error processing record - skipping`);
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

  await db.close();
  log.info("\nData ingestion complete!");

  // Validate the number of processed records
  if (processedRecords !== TOTAL_EXPECTED_RECORDS) {
    log.warn(
      `Warning: Expected ${TOTAL_EXPECTED_RECORDS} records but processed ${processedRecords}`,
    );
  } else {
    log.info(`Successfully ingested all ${processedRecords} records`);
  }

  if (invalidRecords > 0) {
    log.warn(`Found ${invalidRecords} invalid records during processing`);
  }
}
