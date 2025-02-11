import { labelHashToBytes } from "ensrainbow-sdk/label-utils";
import { labelhash } from "viem";
import { LABELHASH_COUNT_KEY, openDatabase, safeGet } from "../lib/database.js";
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

    // Skip count key
    if (byteArraysEqual(key, LABELHASH_COUNT_KEY)) {
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

  // Verify count
  const storedCount = await safeGet(db, LABELHASH_COUNT_KEY);
  const actualCount = totalKeys - 1; // Subtract 1 for count key

  if (!storedCount) {
    log.error("Count key missing from database");
    throw new Error("Count key missing from database");
  }

  const parsedCount = parseNonNegativeInteger(storedCount);
  if (parsedCount !== actualCount) {
    log.error(`Count mismatch: stored=${parsedCount}, actual=${actualCount}`);
    throw new Error(`Count mismatch: stored=${parsedCount}, actual=${actualCount}`);
  } else {
    log.info(`Count verified: ${actualCount} records`);
  }

  // Report results
  log.info("\nValidation Results:");
  log.info(`Total keys: ${totalKeys}`);
  log.info(`Valid hashes: ${validHashes}`);
  log.info(`Invalid hashes: ${invalidHashes}`);
  log.info(`Hash mismatches: ${hashMismatches}`);

  const hasErrors = invalidHashes > 0 || hashMismatches > 0 || !storedCount;
  if (hasErrors) {
    log.error("\nValidation failed! See errors above.");
    throw new Error("Validation failed");
  } else {
    log.info("\nValidation successful! No errors found.");
  }

  await db.close();
}
