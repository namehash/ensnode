import { existsSync } from "fs";
import { rm } from "fs/promises";
import { logger } from "../utils/logger";

export interface PurgeCommandOptions {
  dataDir: string;
}

export async function purgeCommand(options: PurgeCommandOptions): Promise<void> {
  const { dataDir } = options;

  const dirExists = existsSync(dataDir);

  try {
    if (dirExists) {
      logger.info(`Removing database directory at ${dataDir}...`);
      await rm(dataDir, { recursive: true, force: true });
      logger.info("Database directory removed successfully.");
    } else {
      logger.info(`Directory ${dataDir} does not exist, nothing to remove.`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(`Failed to remove database directory: ${errorMessage}`);
    throw error;
  }
}
