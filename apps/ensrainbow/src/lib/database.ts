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
/**
 * Key for storing the namespace
 * Stores the namespace identifier as a string
 */
export const SYSTEM_KEY_NAMESPACE = new Uint8Array([0xff, 0xff, 0xff, 0xfb]) as ByteArray;
export const SCHEMA_VERSION = 3;

// Ingestion status values
export const IngestionStatus = {
  Unstarted: "unstarted",
  Unfinished: "unfinished",
  Finished: "finished",
} as const;

export type IngestionStatus = (typeof IngestionStatus)[keyof typeof IngestionStatus];

/**
 * Splits a label string into its label set number and actual label components.
 * Format of input is expected to be "{labelSet}:{actualLabel}"
 *
 * @param label The label string to split
 * @returns An object containing the label set number and the actual label
 * @throws Error if the label format is invalid or the label set is not a valid number
 */
export function splitLabelString(label: string): { labelSet: number; label: string } {
  const colonIndex = label.indexOf(":");
  if (colonIndex <= 0) {
    throw new Error(`Invalid label format (missing set number prefix): "${label}"`);
  }

  const labelSet = label.substring(0, colonIndex);
  const actualLabel = label.substring(colonIndex + 1);

  try {
    const labelSetNumber = parseNonNegativeInteger(labelSet);
    return { labelSet: labelSetNumber, label: actualLabel };
  } catch (error: unknown) {
    throw new Error(
      `Invalid label set number "${labelSet}" in label "${label}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

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
      byteArraysEqual(key, SYSTEM_KEY_HIGHEST_LABEL_SET) ||
      byteArraysEqual(key, SYSTEM_KEY_NAMESPACE))
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
      }
      //TODO validate lite?

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
        logger.error(`No database found at ${dataDir}`);
        logger.error("If you want to create a new database, start the ingestion step");
        logger.error(`Please ensure you have read permissions for ${dataDir}`);
      }
      throw error;
    }
  }

  /**
   * Opens an existing database or creates a new one if it doesn't exist.
   *
   * This function:
   * 1. Attempts to open an existing database using the open() method
   * 2. If the database doesn't exist, creates a new one using the create() method
   * 3. If opening fails for any other reason (e.g., permission issues), throws the error
   *
   * @param dataDir The directory path where the database is or should be located
   * @returns An instance of ENSRainbowDB
   * @throws Error if there are permission issues or other errors not related to database existence
   */
  public static async openOrCreate(dataDir: string): Promise<ENSRainbowDB> {
    try {
      // First try to open the existing database
      return await ENSRainbowDB.open(dataDir);
    } catch (error) {
      // If database doesn't exist, create a new one
      if (error instanceof Error && error.message.includes("Database is not open")) {
        logger.info(`Database doesn't exist at ${dataDir}, creating a new one`);
        return await ENSRainbowDB.create(dataDir);
      }

      // For any other error, propagate it upward
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
      throw new Error("Highest label set not found");
    }
    return parseNonNegativeInteger(labelSet);
  }

  /**
   * Set the highest label set number directly
   * @param labelSet The label set number to set
   */
  public async setHighestLabelSet(labelSet: number): Promise<void> {
    if (!Number.isInteger(labelSet) || labelSet < 0) {
      throw new Error(`Invalid label set value: ${labelSet}`);
    }
    await this.db.put(SYSTEM_KEY_HIGHEST_LABEL_SET, labelSet.toString());
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
   * Get the namespace from the database
   * @returns The namespace string
   * @throws Error if the namespace is not set
   */
  public async getNamespace(): Promise<string> {
    const namespace = await this.get(SYSTEM_KEY_NAMESPACE);
    if (namespace === null) {
      throw new Error("Database namespace is null");
    }
    return namespace;
  }

  /**
   * Set the namespace in the database
   * @param namespace The namespace string to set
   */
  public async setNamespace(namespace: string): Promise<void> {
    if (!namespace) {
      throw new Error("Namespace cannot be empty");
    }
    await this.db.put(SYSTEM_KEY_NAMESPACE, namespace);
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
  public async getLabel(labelHash: ByteArray): Promise<{ labelSet: number; label: string } | null> {
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
    return splitLabelString(label);
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

    // --- Basic Checks (Run in both Lite and Full mode) ---

    // 1. Check Ingestion Status
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

    // 2. Check Schema Version
    try {
      await this.validateSchemaVersion();
    } catch (error) {
      // We already logged the error in validateSchemaVersion
      return false;
    }

    // 3. Check Namespace Existence
    try {
      const namespace = await this.getNamespace();
      if (namespace === null) {
        const errorMsg = generatePurgeErrorMessage("Database is missing the namespace identifier.");
        logger.error(errorMsg);
        return false;
      }
      logger.info(`Namespace verified: ${namespace}`);
    } catch (error) {
      const errorMsg = generatePurgeErrorMessage(`Error checking namespace: ${error}`);
      logger.error(errorMsg);
      return false;
    }

    // 4. Check Highest Label Set Existence and Validity
    let highestLabelSet: number;
    try {
      highestLabelSet = await this.getHighestLabelSet();
      logger.info(`Highest label set verified: ${highestLabelSet}`);
    } catch (error) {
      // getHighestLabelSet already throws a clear error if value is invalid
      const errorMsg = generatePurgeErrorMessage(`Error checking highest label set: ${error}`);
      logger.error(errorMsg);
      return false;
    }

    // 5. Check Precalculated Count Existence (even in lite mode, the key should exist)
    try {
      const precalculatedCount = await this.getPrecalculatedRainbowRecordCount();
      // Only log the count if we pass validation later
    } catch (error) {
      const errorMsg = generatePurgeErrorMessage(
        `Database is in an invalid state: failed to get precalculated rainbow record count key: ${error}`,
      );
      logger.error(errorMsg);
      return false;
    }

    // --- Lite Mode Completion ---
    if (isLiteMode) {
      // Lite mode passed basic checks
      const precalculatedCount = await this.getPrecalculatedRainbowRecordCount(); // Already checked existence
      logger.info(`Precalculated rainbow record count: ${precalculatedCount}`);
      logger.info("\nLite validation successful! Basic checks passed.");
      return true;
    }

    // --- Full Validation (Requires iterating through records) ---
    logger.info("Starting full validation (iterating through records)...");

    let rainbowRecordCount = 0;
    let validHashes = 0;
    let invalidHashes = 0;
    let hashMismatches = 0;
    let invalidLabelFormats = 0;
    let labelSetMismatches = 0;

    for await (const [key, value] of this.db.iterator()) {
      // Skip keys not associated with rainbow records
      if (isSystemKey(key)) {
        continue;
      }
      rainbowRecordCount++;

      // --- Key Validation (LabelHash Format) ---
      const keyHex = `0x${Buffer.from(key).toString("hex")}` as Hex;
      try {
        labelHashToBytes(keyHex); // Ensures key is 32 bytes and valid hex
        validHashes++;
      } catch (e) {
        logger.error(`Invalid labelHash key format: ${keyHex}`);
        invalidHashes++;
        continue; // Skip further checks for this invalid record
      }

      // --- Value Validation (Label Format & Set Number) ---
      const firstColonIndex = value.indexOf(":");
      let recordLabelSet: number | null = null;

      // If there's no colon or it's the first character, the format is invalid
      if (firstColonIndex <= 0) {
        logger.error(`Invalid label format (missing set number prefix): "${value}"`);
        invalidLabelFormats++;
      } else {
        // Try to parse using the splitLabelString function
        try {
          const result = splitLabelString(value);
          recordLabelSet = result.labelSet;
        } catch (error) {
          logger.error(`Invalid label format: "${value}" - ${error}`);
          invalidLabelFormats++;
        }
      }

      // Only proceed with label set comparison if the format was valid
      if (recordLabelSet !== null) {
        if (recordLabelSet > highestLabelSet) {
          logger.error(
            `Label set mismatch for label "${value}": record set ${recordLabelSet} > highest set ${highestLabelSet}`,
          );
          labelSetMismatches++;
        }
      }

      // --- Key-Value Validation (Hash Match) ---
      const actualLabel = value.substring(firstColonIndex + 1);
      const computedHash = labelHashToBytes(labelhash(actualLabel));
      if (!byteArraysEqual(computedHash, key)) {
        logger.error(
          `Hash mismatch for label "${value}": stored=${keyHex}, computed=0x${Buffer.from(
            computedHash,
          ).toString("hex")}`,
        );
        hashMismatches++;
      }
    }

    // --- Final Count Verification ---
    let precalculatedCount: number | undefined;
    try {
      precalculatedCount = await this.getPrecalculatedRainbowRecordCount();

      if (precalculatedCount !== rainbowRecordCount) {
        const errorMsg = generatePurgeErrorMessage(
          `Count mismatch: precalculated=${precalculatedCount}, actual=${rainbowRecordCount}`,
        );
        logger.error(errorMsg);
        // Don't return immediately, report all errors first
      } else {
        logger.info(`Precalculated count verified: ${rainbowRecordCount} rainbow records`);
      }
    } catch (error) {
      // Should not happen due to early check, but handle defensively
      const errorMsg = generatePurgeErrorMessage(
        `Error verifying precalculated rainbow record count: ${error}`,
      );
      logger.error(errorMsg);
      // Don't return immediately, report all errors first
    }

    // --- Report Results ---
    logger.info("\nValidation Results:");
    logger.info(`Total rainbow records iterated: ${rainbowRecordCount}`);
    logger.info(`Valid labelHash keys: ${validHashes}`);
    logger.info(`Invalid labelHash keys: ${invalidHashes}`);
    logger.info(`Labels with hash mismatches: ${hashMismatches}`);
    logger.info(`Labels with invalid format/set prefix: ${invalidLabelFormats}`);
    logger.info(`Labels with set number > highest set: ${labelSetMismatches}`);
    if (precalculatedCount !== undefined && precalculatedCount !== rainbowRecordCount) {
      logger.error(
        `Count mismatch: precalculated=${precalculatedCount}, actual=${rainbowRecordCount}`,
      );
    }

    // --- Determine Final Outcome ---
    const hasErrors =
      precalculatedCount === undefined || // Error if we couldn't get the precalculated count
      invalidHashes > 0 ||
      hashMismatches > 0 ||
      invalidLabelFormats > 0 ||
      labelSetMismatches > 0 ||
      (precalculatedCount !== undefined && precalculatedCount !== rainbowRecordCount); // Check count mismatch if count was retrieved

    if (hasErrors) {
      const errorMsg = generatePurgeErrorMessage(
        "Full validation failed! See errors above. Database is inconsistent.",
      );
      logger.error(errorMsg);
      return false;
    }

    logger.info("\nFull validation successful! No errors found.");
    return true;
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

  /**
   * Adds a rainbow record to the database.
   *
   * @param label The label to add (without label set prefix)
   * @param labelSet The label set number to associate with this label
   * @throws Error if labelSet is invalid
   */
  public async addRainbowRecord(label: string, labelSet: number): Promise<void> {
    // Validate label set is a non-negative integer
    if (!Number.isInteger(labelSet) || labelSet < 0) {
      throw new Error(`Invalid label set: ${labelSet} (must be a non-negative integer)`);
    }

    const key = labelHashToBytes(labelhash(label));
    await this.db.put(key, `${labelSet}:${label}`);
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
