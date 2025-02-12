import { labelHashToBytes } from "ensrainbow-sdk/label-utils";
import { labelhash } from "viem";
import {
  INGESTION_IN_PROGRESS_KEY,
  LABELHASH_COUNT_KEY,
  openDatabase,
  safeGet,
} from "../lib/database.js";
import { byteArraysEqual } from "../utils/byte-utils.js";
import { LogLevel, createLogger } from "../utils/logger.js";
import { parseNonNegativeInteger } from "../utils/number-utils.js";

export interface ValidateCommandOptions {
  dataDir: string;
  logLevel?: LogLevel;
}

export async function validateCommand(options: ValidateCommandOptions): Promise<void> {
  const log = createLogger(options.logLevel);
  const db = await openDatabase(options.dataDir, options.logLevel);

  let totalKeys = 0;
  let validHashes = 0;
  let invalidHashes = 0;
  let hashMismatches = 0;

  log.info("Starting database validation...");

  // Validate each key-value pair
  for await (const [key, value] of db.iterator()) {
    totalKeys++;

    // Skip keys not associated with rainbow records
    if (
      byteArraysEqual(key, LABELHASH_COUNT_KEY) ||
      byteArraysEqual(key, INGESTION_IN_PROGRESS_KEY)
    ) {
      continue;
    }

    // Verify key is a valid labelhash by converting it to hex string
    const keyHex = `0x${Buffer.from(key).toString("hex")}` as `0x${string}`;
    try {
      labelHashToBytes(keyHex);
      validHashes++;
    } catch (e) {
      log.error(`Invalid labelhash key format: ${keyHex}`);
      invalidHashes++;
      continue;
    }

    // Verify hash matches label
    const computedHash = labelHashToBytes(labelhash(value));
    if (!byteArraysEqual(computedHash, key)) {
      log.error(
        `Hash mismatch for label "${value}": stored=${keyHex}, computed=0x${Buffer.from(computedHash).toString("hex")}`,
      );
      hashMismatches++;
    }
  }

  let rainbowRecordCount = totalKeys;
  // Verify count
  const storedCount = await safeGet(db, LABELHASH_COUNT_KEY);

  if (!storedCount) {
    log.error("Count key missing from database");
    throw new Error("Count key missing from database");
  } else {
    rainbowRecordCount = rainbowRecordCount - 1;
  }

  // Check if ingestion is in progress
  const ingestionInProgress = await safeGet(db, INGESTION_IN_PROGRESS_KEY);
  if (ingestionInProgress) {
    log.error("Database is in an invalid state: ingestion in progress flag is set");
    throw new Error("Database is in an invalid state: ingestion in progress flag is set");
  }

  const parsedCount = parseNonNegativeInteger(storedCount);
  if (parsedCount !== rainbowRecordCount) {
    log.error(`Count mismatch: stored=${parsedCount}, actual=${rainbowRecordCount}`);
    throw new Error(`Count mismatch: stored=${parsedCount}, actual=${rainbowRecordCount}`);
  } else {
    log.info(`Count verified: ${rainbowRecordCount} records`);
  }

  // Report results
  log.info("\nValidation Results:");
  log.info(`Total keys: ${totalKeys}`);
  log.info(`Valid rainbow records: ${validHashes}`);
  log.info(`Invalid rainbow records: ${invalidHashes}`);
  log.info(`labelhash mismatches: ${hashMismatches}`);

  const hasErrors = invalidHashes > 0 || hashMismatches > 0;
  if (hasErrors) {
    log.error("\nValidation failed! See errors above.");
    throw new Error("Validation failed");
  } else {
    log.info("\nValidation successful! No errors found.");
  }

  await db.close();
}
