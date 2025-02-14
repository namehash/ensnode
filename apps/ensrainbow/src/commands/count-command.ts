import {
  ENSRainbowDB,
  INGESTION_IN_PROGRESS_KEY,
  LABELHASH_COUNT_KEY,
  safeGet,
} from "../lib/database";
import { byteArraysEqual } from "../utils/byte-utils";
import { getLogger } from "../utils/logger";
import { parseNonNegativeInteger } from "../utils/number-utils";

export interface CountCommandOptions {
  dataDir: string;
}

export async function countCommand(db: ENSRainbowDB, options: CountCommandOptions): Promise<void> {
  const logger = getLogger();

  // Try to read existing count
  const existingCountStr = await safeGet(db, LABELHASH_COUNT_KEY);
  if (existingCountStr === null) {
    logger.info("No existing count found in database");
  } else {
    const existingCount = parseNonNegativeInteger(existingCountStr);
    existingCount !== null
      ? logger.warn(`Existing count in database: ${existingCount}`)
      : logger.warn(`Invalid count value in database: ${existingCountStr}`);
  }

  logger.info("Counting keys in database...");

  let count = 0;
  for await (const [key] of db.iterator()) {
    // Don't count the count key itself
    if (
      !byteArraysEqual(key, LABELHASH_COUNT_KEY) &&
      !byteArraysEqual(key, INGESTION_IN_PROGRESS_KEY)
    ) {
      count++;
    }
  }

  // Store the count
  await db.put(LABELHASH_COUNT_KEY, count.toString());

  logger.info(`Total number of keys (excluding count key): ${count}`);
  logger.info(`Updated count in database under LABELHASH_COUNT_KEY`);
}
