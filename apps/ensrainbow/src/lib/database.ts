import { join } from "path";
import { ClassicLevel } from "classic-level";
import { ByteArray } from "viem";
import { LogLevel, Logger, createLogger } from "../utils/logger";

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

export const getDataDir = () => process.env.DATA_DIR || join(process.cwd(), "data");

export const createDatabase = async (
  dataDir: string,
  logLevel: LogLevel = "info",
): Promise<ENSRainbowDB> => {
  const logger = createLogger(logLevel);
  logger.info(`Creating new database in directory: ${dataDir}`);

  try {
    return new ClassicLevel<ByteArray, string>(dataDir, {
      keyEncoding: "view",
      valueEncoding: "utf8",
      createIfMissing: true,
      errorIfExists: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("exists")) {
      logger.error(`Database already exists at ${dataDir}`);
      logger.error("If you want to use an existing database, use openDatabase() instead");
      logger.error(
        "If you want to clear the existing database, use createDatabase with clearIfExists=true",
      );
    } else {
      logger.error("Failed to create database:", error);
      logger.error(`Please ensure the directory ${dataDir} is writable`);
    }
    process.exit(1);
  }
};

export const openDatabase = (dataDir: string, logLevel: LogLevel = "info"): ENSRainbowDB => {
  const logger = createLogger(logLevel);
  logger.info(`Opening existing database in directory: ${dataDir}`);

  try {
    return new ClassicLevel<ByteArray, string>(dataDir, {
      keyEncoding: "view",
      valueEncoding: "utf8",
      createIfMissing: false,
      errorIfExists: false,
    });
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
