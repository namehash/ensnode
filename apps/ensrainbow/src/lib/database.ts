import { join } from "path";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk/label-utils";
import { ClassicLevel } from "classic-level";
import { ByteArray, labelhash } from "viem";

import { byteArraysEqual } from "../utils/byte-utils";
import { LogLevel, Logger, createLogger } from "../utils/logger";
import { parseNonNegativeInteger } from "../utils/number-utils";

export const LABELHASH_COUNT_KEY = new Uint8Array([0xff, 0xff, 0xff, 0xff]) as ByteArray;
export const INGESTION_IN_PROGRESS_KEY = new Uint8Array([0xff, 0xff, 0xff, 0xfe]) as ByteArray;

/**
 * Checks if there's an incomplete ingestion and exits with a helpful error message if one is found
 * @param db The ENSRainbow database instance
 * @param logger The logger instance to use for error messages
 */
export async function exitIfIncompleteIngestion(db: ENSRainbowDB, logger: Logger): Promise<void> {
  if (await isIngestionInProgress(db)) {
    logger.error("Error: Database is in an incomplete state!");
    logger.error("An ingestion was started but not completed successfully.");
    logger.error("To fix this:");
    logger.error("1. Delete the data directory");
    logger.error("2. Run the ingestion command again: ensrainbow ingest <input-file>");
    await db.close();
    process.exit(1);
  }
}

/**
 * Type representing the ENSRainbow LevelDB database.
 *
 * Schema:
 * - Keys are binary encoded and represent:
 *   - For labelhash entries: The raw bytes of the ENS labelhash
 *   - For count entries: A special key format for storing label counts
 *
 * - Values are UTF-8 strings and represent:
 *   - For labelhash entries: the label that was hashed to create the labelhash.
 *     Labels are stored exactly as they appear in source data and:
 *     - May or may not be ENS-normalized
 *     - Can contain any valid string, including dots and null bytes
 *     - Can be empty strings
 *   - For count entries: The non-negative integer count of labelhash entries formatted as a string.
 */
export type ENSRainbowDB = ClassicLevel<ByteArray, string>;

export const getDataDir = () => join(process.cwd(), "data");

export const createDatabase = async (
  dataDir: string,
  logLevel: LogLevel = "info",
): Promise<ENSRainbowDB> => {
  const logger = createLogger(logLevel);
  logger.info(`Creating new database in directory: ${dataDir}`);

  try {
    const db = new ClassicLevel<ByteArray, string>(dataDir, {
      keyEncoding: "view",
      valueEncoding: "utf8",
      createIfMissing: true,
      errorIfExists: true,
    });
    logger.info("Opening database...");
    await db.open();
    return db;
  } catch (error) {
    if (
      (error as any).code === "LEVEL_DATABASE_NOT_OPEN" &&
      (error as any).cause?.message?.includes("exists")
    ) {
      logger.error(`Database already exists at ${dataDir}`);
      logger.error("If you want to use an existing database, use openDatabase() instead");
      logger.error(
        "If you want to clear the existing database, use createDatabase with clearIfExists=true",
      );
      throw new Error("Database already exists");
    } else {
      logger.error("Failed to create database:", error);
      logger.error(`Please ensure the directory ${dataDir} is writable`);
      throw error;
    }
  }
};

export const openDatabase = async (
  dataDir: string,
  logLevel: LogLevel = "info",
): Promise<ENSRainbowDB> => {
  const logger = createLogger(logLevel);
  logger.info(`Opening existing database in directory: ${dataDir}`);

  try {
    const db = new ClassicLevel<ByteArray, string>(dataDir, {
      keyEncoding: "view",
      valueEncoding: "utf8",
      createIfMissing: false,
      errorIfExists: false,
    });
    await db.open();
    return db;
  } catch (error) {
    if (error instanceof Error && error.message.includes("does not exist")) {
      logger.error(`No database found at ${dataDir}`);
      logger.error("If you want to create a new database, use createDatabase() instead");
    } else if ((error as any).code === "LEVEL_LOCKED") {
      logger.error(`Database at ${dataDir} is locked - it may be in use by another process`);
      logger.error("Please ensure no other instances of the application are running");
      logger.error("If you're certain no other process is using it, try removing the lock file");
    } else {
      logger.error("Failed to open database:", error);
      logger.error(`Please ensure you have read permissions for ${dataDir}`);
    }
    process.exit(1);
  }
};

/**
 * Check if an ingestion is in progress
 * @param db The ENSRainbow database instance
 * @returns true if an ingestion is in progress, false otherwise
 */
export async function isIngestionInProgress(db: ENSRainbowDB): Promise<boolean> {
  const value = await safeGet(db, INGESTION_IN_PROGRESS_KEY);
  return value !== null;
}

/**
 * Mark that an ingestion has started
 * @param db The ENSRainbow database instance
 */
export async function markIngestionStarted(db: ENSRainbowDB): Promise<void> {
  await db.put(INGESTION_IN_PROGRESS_KEY, "true");
}

/**
 * Clear the ingestion in progress marker
 * @param db The ENSRainbow database instance
 */
export async function clearIngestionMarker(db: ENSRainbowDB): Promise<void> {
  try {
    await db.del(INGESTION_IN_PROGRESS_KEY);
  } catch (error) {
    if ((error as any).code !== "LEVEL_NOT_FOUND") {
      throw error;
    }
  }
}

/**
 * Helper function to safely get a value from the database.
 * Returns null if the key is not found.
 * Throws an error for any other database error.
 *
 * @param db The ENSRainbow database instance
 * @param key The ByteArray key to look up
 * @returns The value as a string if found, null if not found
 * @throws Error if any database error occurs other than key not found
 */
export async function safeGet(db: ENSRainbowDB, key: ByteArray): Promise<string | null> {
  try {
    const value = await db.get(key);
    return value;
  } catch (error) {
    if ((error as any).code === "LEVEL_NOT_FOUND") {
      return null;
    }
    throw error;
  }
}

/**
 * Validates the database contents.
 * Returns true if validation passes, false if validation fails.
 *
 * @param db The ENSRainbow database instance
 * @param logger The logger instance to use for messages
 * @returns boolean indicating if validation passed
 */
export async function validate(db: ENSRainbowDB, logger: Logger): Promise<boolean> {
  let totalKeys = 0;
  let validHashes = 0;
  let invalidHashes = 0;
  let hashMismatches = 0;

  logger.info("Starting database validation...");

  // Check if ingestion is in progress
  const ingestionInProgress = await safeGet(db, INGESTION_IN_PROGRESS_KEY);
  if (ingestionInProgress) {
    logger.error("Database is in an invalid state: ingestion in progress flag is set");
    return false;
  }

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
      logger.error(`Invalid labelhash key format: ${keyHex}`);
      invalidHashes++;
      continue;
    }

    // Verify hash matches label
    const computedHash = labelHashToBytes(labelhash(value));
    if (!byteArraysEqual(computedHash, key)) {
      logger.error(
        `Hash mismatch for label "${value}": stored=${keyHex}, computed=0x${Buffer.from(
          computedHash,
        ).toString("hex")}`,
      );
      hashMismatches++;
    }
  }

  let rainbowRecordCount = totalKeys;
  // Verify count
  const storedCount = await safeGet(db, LABELHASH_COUNT_KEY);

  if (!storedCount) {
    logger.error("Count key missing from database");
    return false;
  } else {
    rainbowRecordCount = rainbowRecordCount - 1;
  }

  const parsedCount = parseNonNegativeInteger(storedCount);
  if (parsedCount !== rainbowRecordCount) {
    logger.error(`Count mismatch: stored=${parsedCount}, actual=${rainbowRecordCount}`);
    return false;
  } else {
    logger.info(`Count verified: ${rainbowRecordCount} rainbow records`);
  }

  // Report results
  logger.info("\nValidation Results:");
  logger.info(`Total keys: ${totalKeys}`);
  logger.info(`Valid rainbow records: ${validHashes}`);
  logger.info(`Invalid rainbow records: ${invalidHashes}`);
  logger.info(`labelhash mismatches: ${hashMismatches}`);

  const hasErrors = invalidHashes > 0 || hashMismatches > 0;
  if (hasErrors) {
    logger.error("\nValidation failed! See errors above.");
    return false;
  } else {
    logger.info("\nValidation successful! No errors found.");
    return true;
  }
}
