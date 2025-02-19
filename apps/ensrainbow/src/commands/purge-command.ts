import { rm } from "fs/promises";
import { logger } from "../utils/logger";

export interface PurgeCommandOptions {
  dataDir: string;
}

export async function purgeCommand(options: PurgeCommandOptions): Promise<void> {
  const { dataDir } = options;

  try {
    logger.info(`Removing database directory at ${dataDir}...`);
    await rm(dataDir, { recursive: true, force: true });
    logger.info("Database directory removed successfully.");
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to remove database directory: ${error.message}`);
    } else {
      logger.error("Failed to remove database directory: Unknown error");
    }
    throw error;
  }
}
