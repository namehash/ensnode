import { labelHashToBytes } from "@ensnode/ensrainbow-sdk/label-utils";
import { ClassicLevel } from "classic-level";
import { ByteArray, Hex, labelhash } from "viem";

import { logger } from "@/utils/logger";
import { Label } from "@ensnode/utils";

// System keys must have a byte length different from 32 to avoid collisions with labelHashes
export const SYSTEM_KEY_PRECALCULATED_RAINBOW_RECORD_COUNT = new Uint8Array([
  0xff, 0xff, 0xff, 0xff,
]) as ByteArray;
/**
 * Key for storing the ingestion status
 * Possible values:
 * - unstarted: Ingestion has never been started
 * - unfinished: Ingestion was started but hasn't finished
 * - finished: Ingestion has finished successfully
 */
export const SYSTEM_KEY_INGESTION_STATUS = new Uint8Array([0xff, 0xff, 0xff, 0xfe]) as ByteArray;
export const SYSTEM_KEY_SCHEMA_VERSION = new Uint8Array([0xff, 0xff, 0xff, 0xfd]) as ByteArray;
/**
 * Key for storing the highest label set counter
 * Stores the current label set number as a string
 */
export const SYSTEM_KEY_HIGHEST_LABEL_SET = new Uint8Array([0xff, 0xff, 0xff, 0xfc]) as ByteArray;
export const SCHEMA_VERSION = 2;

// Ingestion status values
export const IngestionStatus = {
  Unstarted: "unstarted",
  Unfinished: "unfinished",
  Finished: "finished",
} as const;

export type IngestionStatus = (typeof IngestionStatus)[keyof typeof IngestionStatus];

/**
 * Checks if a key is a system key (one of the special keys used for database metadata).
 * @param key The ByteArray key to check
 * @returns true if the key is a system key, false otherwise
 */
export function isSystemKey(key: ByteArray): boolean {
  return (
    !isRainbowRecordKey(key) &&
    (byteArraysEqual(key, SYSTEM_KEY_PRECALCULATED_RAINBOW_RECORD_COUNT) ||
      byteArraysEqual(key, SYSTEM_KEY_INGESTION_STATUS) ||
      byteArraysEqual(key, SYSTEM_KEY_SCHEMA_VERSION) ||
      byteArraysEqual(key, SYSTEM_KEY_HIGHEST_LABEL_SET))
  );
}

/**
 * Checks if a key is a valid rainbow record key (a 32-byte ByteArray representing an ENS labelHash).
 * @param key The ByteArray key to check
 * @returns true if the key is a valid rainbow record key (32 bytes long), false otherwise
 */
export function isRainbowRecordKey(key: ByteArray): boolean {
  return key.length === 32;
}

/**
 * Type representing the ENSRainbow LevelDB database.
 *
 * Schema:
 * - Keys are binary encoded and represent:
 *   - For rainbow records: The raw bytes of the ENS labelHash. Always a byte length of 32.
 *   - For metadata: A special key format for storing metadata. Always a byte length other than 32.
 *
 * - Values are UTF-8 strings and represent:
 *   - For rainbow records: the label that was hashed to create the labelHash.
 *     Labels are stored exactly as they appear in source data and:
 *     - May or may not be ENS-normalized
 *     - Can contain any valid string, including '.' (dot / period / full stop) and null bytes
 *     - Can be empty strings
 *   - For metadata: string values storing database metadata like:
 *     - Schema version number (string formatted as a non-negative integer)
 *     - Precalculated rainbow record count (string formatted as a non-negative integer)
 *     - Ingestion status flag ("true" string)
 */
type ENSRainbowLevelDB = ClassicLevel<ByteArray, string>;

/**
 * Generates a consistent error message for database issues that require purging and re-ingesting.
 * @param errorDescription The specific error description
 * @returns Formatted error message with purge warning and instructions
 */
function generatePurgeErrorMessage(errorDescription: string): string {
  return (
    `${errorDescription}\n\nTo fix this:\n` +
    "1. Run the purge command to start fresh: pnpm run purge --data-dir <your-data-dir>\n" +
    "2. Run the ingestion command again: pnpm run ingest <input-file>\n\n" +
    "⚠️ WARNING: The purge command will COMPLETELY REMOVE ALL FILES in the specified directory!\n" +
    "Make sure you specify the correct directory and have backups if needed."
  );
}

export class ENSRainbowDB {
  private constructor(
    private readonly db: ENSRainbowLevelDB,
    private readonly dataDir: string,
  ) {}

  /**
   * Creates and opens a new ENSRainbowDB instance with a fresh database.
   * This function:
   * 1. Creates a new LevelDB database at the specified directory
   * 2. Opens the database connection
   * 3. Initializes a new ENSRainbowDB instance with the database
   * 4. Sets the database schema version to the current expected version
   *
   * The schema version is set to guard against potential incompatibility with future database upgrades.
   *
   * @throws Error in the following cases:
   * - If a database already exists at the specified directory
   * - If there are insufficient permissions to write to the directory
   * - If the directory is not accessible
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
      const dbInstance = new ENSRainbowDB(db, dataDir);
      await dbInstance.setDatabaseSchemaVersion(SCHEMA_VERSION);
      return dbInstance;
    } catch (error) {
      if (
        (error as any).code === "LEVEL_DATABASE_NOT_OPEN" &&
        (error as any).cause?.message?.includes("exists")
      ) {
        logger.error(`Database already exists at ${dataDir}`);
        logger.error("If you want to use an existing database, omit ingestion step");
        logger.error(
          "If you want to start fresh with a new database, first remove the existing database directory",
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
   * This function:
   * 1. Opens an existing LevelDB database at the specified directory
   * 2. Initializes an ENSRainbowDB instance with the database
   * 3. Verifies the database schema version matches the expected version
   *
   * If the schema version doesn't match the expected version, an error is thrown
   * to prevent operations on an incompatible database.
   *
   * @throws Error in the following cases:
   * - If the database directory does not exist
   * - If the database is locked by another process
   * - If the schema version doesn't match the expected version
   * - If there are insufficient permissions to read the database
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
      const dbInstance = new ENSRainbowDB(db, dataDir);

      // Verify schema version
      await dbInstance.validateSchemaVersion();

      // Check if HIGHEST_LABEL_SET exists, initialize it if not
      //TODO: move to method
      try {
        await dbInstance.getHighestLabelSet();
      } catch (error) {
        logger.warn("Highest label set not found, initializing to 0");
        await db.put(SYSTEM_KEY_HIGHEST_LABEL_SET, "0");
      }

      return dbInstance;
    } catch (error) {
      if (error instanceof Error && error.message.includes("does not exist")) {
        logger.error(`No database found at ${dataDir}`);
        logger.error("If you want to create a new database, start the ingestion step");
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
   * Get the current ingestion status
   * @returns The current ingestion status:
   * - IngestionStatus.Unstarted: Ingestion has never been started
   * - IngestionStatus.Unfinished: Ingestion was started but hasn't finished
   * - IngestionStatus.Finished: Ingestion has finished successfully
   * @throws Error if the value in the database is not a recognized enum value
   */
  public async getIngestionStatus(): Promise<IngestionStatus> {
    const status = await this.get(SYSTEM_KEY_INGESTION_STATUS);
    if (status === null) {
      return IngestionStatus.Unstarted;
    }

    return ENSRainbowDB.validateIngestionStatus(status);
  }

  /**
   * Validates if a string is a valid IngestionStatus value
   * @param maybeIngestionStatus - The string to validate
   * @returns The validated IngestionStatus
   * @throws Error if the string is not a valid IngestionStatus
   */
  private static validateIngestionStatus(maybeIngestionStatus: string): IngestionStatus {
    // Check if the provided string exists as a value in the IngestionStatus object
    if (Object.values(IngestionStatus).includes(maybeIngestionStatus as any)) {
      return maybeIngestionStatus as IngestionStatus;
    }

    // If not valid, throw an error with helpful message
    throw new Error(
      `Invalid ingestion status: "${maybeIngestionStatus}". ` +
        `Valid values are: ${Object.values(IngestionStatus).join(", ")}`,
    );
  }

  /**
   * Mark that an ingestion has started and is unfinished
   * Sets the ingestion status to IngestionStatus.Unfinished
   */
  public async markIngestionUnfinished(): Promise<void> {
    await this.db.put(SYSTEM_KEY_INGESTION_STATUS, IngestionStatus.Unfinished);
  }

  /**
   * Mark that ingestion is finished
   * Sets the ingestion status to IngestionStatus.Finished
   */
  public async markIngestionFinished(): Promise<void> {
    await this.db.put(SYSTEM_KEY_INGESTION_STATUS, IngestionStatus.Finished);
  }

  /**
   * Get the current highest label set number
   * @returns The current highest label set number, or 0 if not set yet
   */
  public async getHighestLabelSet(): Promise<number> {
    const labelSet = await this.get(SYSTEM_KEY_HIGHEST_LABEL_SET);
    if (labelSet === null) {
      return 0;
    }
    return parseNonNegativeInteger(labelSet);
  }

  /**
   * Increment the highest label set number and return the new value
   * @returns The new highest label set number after incrementing
   */
  public async incrementHighestLabelSet(): Promise<number> {
    const currentValue = await this.getHighestLabelSet();
    const newValue = currentValue + 1;
    await this.db.put(SYSTEM_KEY_HIGHEST_LABEL_SET, newValue.toString());
    return newValue;
  }

  /**
   * Get the batch interface for the underlying LevelDB.
   * This is exposed for pragmatic reasons to simplify the ingestion process.
   */
  public batch() {
    return this.db.batch();
  }

  /**
   * Helper function to get a value from the database.
   * Returns null if the key is not found.
   * Throws an error for any other database error.
   *
   * @param key The ByteArray key to look up
   * @returns The value as a string if found, null if not found
   * @throws Error if any database error occurs other than key not found
   */
  private async get(key: ByteArray): Promise<string | null> {
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
   * Retrieves a label from the database by its labelHash.
   *
   * @param labelHash The ByteArray labelHash to look up
   * @returns The label as a string if found, null if not found
   * @throws Error if the provided key is a system key or if any database error occurs
   */
  public async getLabel(labelHash: ByteArray): Promise<Label | null> {
    // Verify that the key has the correct length for a labelHash (32 bytes) which means it is not a system key
    if (!isRainbowRecordKey(labelHash)) {
      throw new Error(`Invalid labelHash length: expected 32 bytes, got ${labelHash.length} bytes`);
    }

    const label = await this.get(labelHash);
    if (label === null) {
      return null;
    }

    // Validate the label format (must have a label set prefix)
    //TODO: remove
    // if (!label.includes(':')) {
    //   logger.warn(`Label with missing set prefix found: "${label}"`);
    // }

    return label;
  }

  /**
   * Helper function to delete a key from the database.
   * Returns true if the key existed and was deleted, false if the key did not exist.
   * Throws an error for any database error other than key not found.
   *
   * @param key The ByteArray key to delete
   * @returns boolean indicating if the key was deleted (true) or didn't exist (false)
   * @throws Error if any database error occurs other than key not found
   */
  private async del(key: ByteArray): Promise<boolean> {
    try {
      await this.db.del(key);
      return true;
    } catch (error) {
      if ((error as any).code === "LEVEL_NOT_FOUND") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Closes the database.
   *
   * This method:
   * 1. Waits for any pending operations to complete
   * 2. Flushes any pending writes to disk
   * 3. Releases resources associated with the database
   *
   * It's important to call this method before exiting the application
   * to ensure all data is properly persisted.
   */
  public async close(): Promise<void> {
    logger.info(`Closing database at ${this.dataDir}`);
    await this.db.close();
  }

  /**
   * Gets the precalculated count of rainbow records in the database. The accuracy of the returned value is dependent on setting the precalculated count correctly.
   * @throws Error if the precalculated count is not found or is improperly formatted
   */
  public async getPrecalculatedRainbowRecordCount(): Promise<number> {
    const countStr = await this.get(SYSTEM_KEY_PRECALCULATED_RAINBOW_RECORD_COUNT);
    if (countStr === null) {
      throw new Error(`No precalculated count found in database at ${this.dataDir}`);
    }

    try {
      const count = parseNonNegativeInteger(countStr);
      return count;
    } catch (error) {
      throw new Error(
        `Invalid precalculated count value in database at ${this.dataDir}: ${countStr}`,
      );
    }
  }

  /**
   * Sets the precalculated count of rainbow records in the database.
   */
  public async setPrecalculatedRainbowRecordCount(count: number): Promise<void> {
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`Invalid precalculated count value: ${count}`);
    }
    await this.db.put(SYSTEM_KEY_PRECALCULATED_RAINBOW_RECORD_COUNT, count.toString());
    logger.info(`Updated count in database under PRECALCULATED_RAINBOW_RECORD_COUNT_KEY`);
  }

  /**
   * Gets the database schema version.
   * @returns The current schema version as a non-negative integer, or null if not set
   * @throws Error if schema version is not a valid non-negative integer
   */
  public async getDatabaseSchemaVersion(): Promise<number | null> {
    const versionStr = await this.get(SYSTEM_KEY_SCHEMA_VERSION);
    if (versionStr === null) {
      return null;
    }

    try {
      return parseNonNegativeInteger(versionStr);
    } catch (error) {
      throw new Error(`Invalid schema version in database: ${versionStr}`);
    }
  }

  /**
   * Validates that the database schema version matches the expected version.
   * @throws Error if schema version doesn't match the expected version
   */
  public async validateSchemaVersion(): Promise<void> {
    const schemaVersion = await this.getDatabaseSchemaVersion();
    if (schemaVersion !== SCHEMA_VERSION) {
      const schemaVersionMismatchError = `Database schema version mismatch: expected=${SCHEMA_VERSION}, actual=${schemaVersion}`;
      const errorMsg = generatePurgeErrorMessage(schemaVersionMismatchError);
      logger.error(errorMsg);
      // await this.close();
      throw new Error(schemaVersionMismatchError);
    }
  }

  /**
   * Sets the database schema version.
   * @param version The schema version to set
   * @throws Error if version is not a valid non-negative integer
   */
  public async setDatabaseSchemaVersion(version: number): Promise<void> {
    if (!Number.isInteger(version) || version < 0) {
      throw new Error(`Invalid schema version: ${version}`);
    }
    await this.db.put(SYSTEM_KEY_SCHEMA_VERSION, version.toString());
  }

  /**
   * Validates the database to ensure it's in a consistent state.
   *
   * Validation includes:
   * 1. Checking the ingestion status (must be "finished" for a valid database)
   * 2. Verifying the schema version matches the expected version
   * 3. In full validation mode: Verifying the keys for all rainbow records are valid labelHashes and match their related labels
   * 4. In full validation mode: Verifying the precalculated rainbow record count matches the actual count
   *
   * @param options Validation options
   * @param options.lite If true, performs a faster validation by skipping labelHash verification and precalculated record count validation
   * @returns boolean indicating if validation passed
   */
  public async validate(options: { lite?: boolean } = {}): Promise<boolean> {
    // Fully materialize the lite option into an explicit boolean value
    const isLiteMode = options.lite === true;

    logger.info(`Starting database validation${isLiteMode ? " (lite mode)" : ""}...`);
    // Verify that the attached db fully completed its ingestion (ingestion not interrupted)

    let ingestionStatus: IngestionStatus;
    try {
      ingestionStatus = await this.getIngestionStatus();
    } catch (e) {
      const errorMsg = generatePurgeErrorMessage(
        `Database has an unknown ingestion status: ${e instanceof Error ? e.message : String(e)}`,
      );
      logger.error(errorMsg);
      return false;
    }

    if (ingestionStatus === IngestionStatus.Unstarted) {
      const errorMsg =
        "Database has never been initialized with an ingestion process. Please run an ingestion first: pnpm run ingest <input-file>";
      logger.error(errorMsg);
      return false;
    }

    if (ingestionStatus === IngestionStatus.Unfinished) {
      const errorMsg = generatePurgeErrorMessage(
        "Database is in an incomplete state! An ingestion was started but not completed successfully.",
      );
      logger.error(errorMsg);
      return false;
    }

    try {
      await this.validateSchemaVersion();
    } catch (error) {
      // We already logged the error in validateSchemaVersion
      return false;
    }

    //TODO should we validate if the count is TOTAL_EXPECTED_RECORDS?

    let rainbowRecordCount = 0;
    let validHashes = 0;
    let invalidHashes = 0;
    let hashMismatches = 0;

    // In lite mode, just verify we can get the precalculated rainbow record count
    if (isLiteMode) {
      try {
        const precalculatedCount = await this.getPrecalculatedRainbowRecordCount();
        logger.info(`Precalculated rainbow record count: ${precalculatedCount}`);
        return true;
      } catch (error) {
        const errorMsg = generatePurgeErrorMessage(
          `Database is in an invalid state: failed to get precalculated rainbow record count: ${error}`,
        );
        logger.error(errorMsg);
        return false;
      }
    } else {
      // Full validation of each key-value pair
      for await (const [key, value] of this.db.iterator()) {
        // Skip keys not associated with rainbow records
        if (isSystemKey(key)) {
          continue;
        }
        rainbowRecordCount++;
        // Verify key is a valid labelHash by converting it to hex string
        const keyHex = `0x${Buffer.from(key).toString("hex")}` as Hex;
        try {
          labelHashToBytes(keyHex);
          validHashes++;
        } catch (e) {
          logger.error(`Invalid labelHash key format: ${keyHex}`);
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

      // Verify precalculated rainbow record count
      try {
        const precalculatedCount = await this.getPrecalculatedRainbowRecordCount();

        if (precalculatedCount !== rainbowRecordCount) {
          const errorMsg = generatePurgeErrorMessage(
            `Count mismatch: precalculated=${precalculatedCount}, actual=${rainbowRecordCount}`,
          );
          logger.error(errorMsg);
          return false;
        }
        logger.info(`Precalculated count verified: ${rainbowRecordCount} rainbow records`);
      } catch (error) {
        const errorMsg = generatePurgeErrorMessage(
          `Error verifying precalculated rainbow record count: ${error}`,
        );
        logger.error(errorMsg);
        return false;
      }

      // Report results
      logger.info("\nValidation Results:");
      logger.info(`Total keys: ${rainbowRecordCount}`);
      logger.info(`Valid rainbow records: ${validHashes}`);
      logger.info(`Invalid rainbow records: ${invalidHashes}`);
      logger.info(`labelHash mismatches: ${hashMismatches}`);

      // Return false if any validation errors were found
      if (invalidHashes > 0 || hashMismatches > 0) {
        const errorMsg = generatePurgeErrorMessage("Validation failed! See errors above.");
        logger.error(errorMsg);
        return false;
      }

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

  /**
   * Counts the actual number of rainbow records in the database by iterating through all records.
   *
   * Unlike getPrecalculatedRainbowRecordCount(), this method determines the TRUE count
   * by scanning the entire database, rather than using the stored precalculated count.
   *
   * @warning This function iterates through every record in the database and may take
   * a significant amount of time to complete for large databases. It is primarily intended
   * for use during data ingestion or database maintenance operations, not during normal
   * application runtime.
   *
   * @returns The actual number of rainbow records in the database
   */
  public async countRainbowRecords(): Promise<number> {
    // Try to read existing precalculated count
    try {
      const precalculatedCount = await this.getPrecalculatedRainbowRecordCount();
      logger.warn(`Existing precalculated count in database: ${precalculatedCount}`);
    } catch (error) {
      logger.info("No existing precalculated count found in database");
    }

    logger.info("Counting rainbow records in database...");

    let count = 0;
    for await (const [key] of this.db.iterator()) {
      // Skip keys not associated with rainbow records
      if (isSystemKey(key)) {
        continue;
      }
      count++;
    }

    logger.info(`Total number of rainbow records: ${count}`);

    return count;
  }

  public async addRainbowRecord(label: string) {
    const key = labelHashToBytes(labelhash(label));
    await this.db.put(key, label);
  }
}

export function byteArraysEqual(a: ByteArray, b: ByteArray): boolean {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

/**
 * Parses a string into a non-negative integer.
 * @param input The string to parse
 * @returns The parsed non-negative integer
 * @throws Error if the input is not a valid non-negative integer
 */
export function parseNonNegativeInteger(maybeNumber: string): number {
  const trimmed = maybeNumber.trim();

  // Check for empty strings
  if (!trimmed) {
    throw new Error("Input cannot be empty");
  }

  // Check for -0
  if (trimmed === "-0") {
    throw new Error("Negative zero is not a valid non-negative integer");
  }

  const num = Number(maybeNumber);

  // Check if it's not a number
  if (Number.isNaN(num)) {
    throw new Error(`"${maybeNumber}" is not a valid number`);
  }

  // Check if it's not finite
  if (!Number.isFinite(num)) {
    throw new Error(`"${maybeNumber}" is not a finite number`);
  }

  // Check if it's not an integer
  if (!Number.isInteger(num)) {
    throw new Error(`"${maybeNumber}" is not an integer`);
  }

  // Check if it's negative
  if (num < 0) {
    throw new Error(`"${maybeNumber}" is not a non-negative integer`);
  }

  return num;
}
