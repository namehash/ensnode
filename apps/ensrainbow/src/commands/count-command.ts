import { ENSRainbowDB, safeGet } from "../lib/database.js";
import { LABELHASH_COUNT_KEY } from "../lib/database.js";
import { byteArraysEqual } from "../utils/byte-utils.js";
import { LogLevel, createLogger } from "../utils/logger.js";
import { parseNonNegativeInteger } from "../utils/number-utils.js";

export interface CountCommandOptions {
  dataDir: string;
  logLevel?: LogLevel;
}

export async function countCommand(db: ENSRainbowDB, options: CountCommandOptions): Promise<void> {
  const log = createLogger(options.logLevel);

  // Try to read existing count
  const existingCountStr = await safeGet(db, LABELHASH_COUNT_KEY);
  if (existingCountStr === null) {
    log.info("No existing count found in database");
  } else {
    const existingCount = parseNonNegativeInteger(existingCountStr);
    existingCount !== null
      ? log.warn(`Existing count in database: ${existingCount}`)
      : log.warn(`Invalid count value in database: ${existingCountStr}`);
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
}
