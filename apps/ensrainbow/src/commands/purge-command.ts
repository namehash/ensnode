import { rm } from "fs/promises";

import { logger } from "@/utils/logger";
import { getErrorMessage } from "@/utils/error-utils";

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
    const errorMessage = getErrorMessage(error);

    logger.error(`Failed to remove database directory: ${errorMessage}`);
    throw error;
  }
}
