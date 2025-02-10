import { join } from "path";
import { ClassicLevel } from "classic-level";
import { ByteArray } from "viem";
import { createLogger } from "../utils/logger";

const logger = createLogger();

export const getDataDir = () => process.env.DATA_DIR || join(process.cwd(), "data");

export const initializeDatabase = (dataDir: string): ClassicLevel<ByteArray, string> => {
  logger.info(`Initializing database with data directory: ${dataDir}`);

  try {
    return new ClassicLevel<ByteArray, string>(dataDir, {
      keyEncoding: "binary",
      valueEncoding: "utf8",
    });
  } catch (error) {
    logger.error("Failed to initialize database:", error);
    logger.error(`Please ensure the directory ${dataDir} exists and is writable`);
    process.exit(1);
  }
};
