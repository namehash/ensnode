import { openDatabase } from "../lib/database.js";
import { byteArraysEqual } from "../utils/byte-utils.js";
import { LABELHASH_COUNT_KEY } from "../utils/constants.js";
import { LogLevel, createLogger } from "../utils/logger.js";

export interface CountCommandOptions {
  dataDir: string;
  logLevel?: LogLevel;
}

export async function countCommand(options: CountCommandOptions): Promise<void> {
  const log = createLogger(options.logLevel);
  const db = openDatabase(options.dataDir, options.logLevel);

  // Try to read existing count
  try {
    const existingCount = await db.get(LABELHASH_COUNT_KEY);
    log.info(`Existing count in database: ${existingCount}`);
  } catch (error: any) {
    if (error.code !== "LEVEL_NOT_FOUND") {
      log.error("Error reading existing count:", error);
    } else {
      log.info("No existing count found in database");
    }
  }

  log.info("Counting keys in database...");

  let count = 0;
  for await (const [key] of db.iterator()) {
    // Don't count the count key itself
    if (!byteArraysEqual(key, LABELHASH_COUNT_KEY)) {
      count++;
    }
  }

  // Store the count
  await db.put(LABELHASH_COUNT_KEY, count.toString());

  log.info(`Total number of keys (excluding count key): ${count}`);
  log.info(`Updated count in database under LABELHASH_COUNT_KEY`);

  await db.close();
}
