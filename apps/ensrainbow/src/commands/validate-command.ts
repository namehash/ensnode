import { openDatabase, validate } from "../lib/database.js";
import { LogLevel, createLogger } from "../utils/logger.js";

export interface ValidateCommandOptions {
  dataDir: string;
  logLevel?: LogLevel;
}

export async function validateCommand(options: ValidateCommandOptions): Promise<void> {
  const log = createLogger(options.logLevel);
  const db = await openDatabase(options.dataDir, options.logLevel);

  try {
    const isValid = await validate(db, log);
    if (!isValid) {
      throw new Error("Validation failed");
    }
  } finally {
    await db.close();
  }
}
