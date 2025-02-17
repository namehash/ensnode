import { labelHashToBytes } from "@ensnode/ensrainbow-sdk/label-utils";
import { ClassicLevel } from "classic-level";
import { ByteArray, labelhash } from "viem";

import { logger } from "../utils/logger";

export const LABELHASH_COUNT_KEY = new Uint8Array([0xff, 0xff, 0xff, 0xff]) as ByteArray;
export const INGESTION_IN_PROGRESS_KEY = new Uint8Array([0xff, 0xff, 0xff, 0xfe]) as ByteArray;

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
type ENSRainbowLevelDB = ClassicLevel<ByteArray, string>;

export class ENSRainbowDB {
  private constructor(private readonly db: ENSRainbowLevelDB) {}

  /**
   * Creates a new ENSRainbowDB instance with a fresh database.
   */
  public static async create(dataDir: string): Promise<ENSRainbowDB> {
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
      return new ENSRainbowDB(db);
    } catch (error) {
      if (
        (error as any).code === "LEVEL_DATABASE_NOT_OPEN" &&
        (error as any).cause?.message?.includes("exists")
      ) {
        logger.error(`Database already exists at ${dataDir}`);
        logger.error("If you want to use an existing database, use open() instead");
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
  }

  /**
   * Opens an existing ENSRainbowDB instance.
   */
  public static async open(dataDir: string): Promise<ENSRainbowDB> {
    logger.info(`Opening existing database in directory: ${dataDir}`);

    try {
      const db = new ClassicLevel<ByteArray, string>(dataDir, {
        keyEncoding: "view",
        valueEncoding: "utf8",
        createIfMissing: false,
        errorIfExists: false,
      });
      await db.open();
      return new ENSRainbowDB(db);
    } catch (error) {
      if (error instanceof Error && error.message.includes("does not exist")) {
        logger.error(`No database found at ${dataDir}`);
        logger.error("If you want to create a new database, use create() instead");
      } else if ((error as any).code === "LEVEL_LOCKED") {
        logger.error(`Database at ${dataDir} is locked - it may be in use by another process`);
        logger.error("Please ensure no other instances of the application are running");
        logger.error("If you're certain no other process is using it, try removing the lock file");
      } else {
        logger.error("Failed to open database:", error);
        logger.error(`Please ensure you have read permissions for ${dataDir}`);
      }
      throw error;
    }
  }

  /**
   * Check if an ingestion is in progress
   * @returns true if an ingestion is in progress, false otherwise
   */
  public async isIngestionInProgress(): Promise<boolean> {
    const value = await this.safeGet(INGESTION_IN_PROGRESS_KEY);
    return value !== null;
  }

  /**
   * Mark that an ingestion has started
   */
  public async markIngestionStarted(): Promise<void> {
    await this.db.put(INGESTION_IN_PROGRESS_KEY, "true");
  }

  /**
   * Clear the ingestion in progress marker
   */
  public async clearIngestionMarker(): Promise<void> {
    try {
      await this.db.del(INGESTION_IN_PROGRESS_KEY);
    } catch (error) {
      if ((error as any).code !== "LEVEL_NOT_FOUND") {
        throw error;
      }
    }
  }

  /**
   * Get the batch interface for the underlying LevelDB.
   * This is exposed for pragmatic reasons to simplify the ingestion process.
   */
  public batch() {
    return this.db.batch();
  }

  /**
   * Helper function to safely get a value from the database.
   * Returns null if the key is not found.
   * Throws an error for any other database error.
   *
   * @param key The ByteArray key to look up
   * @returns The value as a string if found, null if not found
   * @throws Error if any database error occurs other than key not found
   */
  public async safeGet(key: ByteArray): Promise<string | null> {
    try {
      const value = await this.db.get(key);
      return value;
    } catch (error) {
      if ((error as any).code === "LEVEL_NOT_FOUND") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Closes the database connection.
   */
  public async close(): Promise<void> {
    await this.db.close();
  }

  /**
   * Gets the current count of rainbow records in the database.
   * @throws Error if count is not found or is improperly formatted
   */
  public async getRainbowRecordCount(): Promise<number> {
    const countStr = await this.safeGet(LABELHASH_COUNT_KEY);
    if (countStr === null) {
      throw new Error("No count found in database");
    }

    const count = parseNonNegativeInteger(countStr);
    if (count === null) {
      throw new Error(`Invalid count value in database: ${countStr}`);
    }

    return count;
  }

  /**
   * Sets the count of rainbow records in the database.
   */
  public async setRainbowRecordCount(count: number): Promise<void> {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`Invalid count value: ${count}`);
    }
    await this.db.put(LABELHASH_COUNT_KEY, count.toString());
  }

  /**
   * Validates the database contents.
   * @returns boolean indicating if validation passed
   */
  public async validate(): Promise<boolean> {
    let totalKeys = 0;
    let validHashes = 0;
    let invalidHashes = 0;
    let hashMismatches = 0;

    logger.info("Starting database validation...");

    // Check if ingestion is in progress
    if (await this.isIngestionInProgress()) {
      logger.error("Database is in an invalid state: ingestion in progress flag is set");
      return false;
    }

    // Validate each key-value pair
    for await (const [key, value] of this.db.iterator()) {
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
    try {
      const storedCount = await this.getRainbowRecordCount();
      rainbowRecordCount = rainbowRecordCount - 1; // Subtract 1 for the count key

      if (storedCount !== rainbowRecordCount) {
        logger.error(`Count mismatch: stored=${storedCount}, actual=${rainbowRecordCount}`);
        return false;
      } else {
        logger.info(`Count verified: ${rainbowRecordCount} rainbow records`);
      }
    } catch (error) {
      logger.error("Error verifying count:", error);
      return false;
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

  /**
   * Clears the database.
   */
  public async clear(): Promise<void> {
    await this.db.clear();
  }
}

export function byteArraysEqual(a: ByteArray, b: ByteArray): boolean {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

/**
 * Parses a string into a non-negative integer.
 * @param input The string to parse
 * @returns The parsed non-negative integer, or null if invalid
 */
export function parseNonNegativeInteger(input: string): number | null {
  const trimmed = input.trim();

  // Early return for empty strings or -0
  if (!trimmed || trimmed === "-0") {
    return null;
  }

  const num = Number(input);

  // Ensure it's a finite number, an integer, and non-negative
  if (Number.isFinite(num) && Number.isInteger(num) && num >= 0) {
    return num;
  }

  return null; // Return null if invalid
}
