import { openDatabase, validate } from "../lib/database";

export interface ValidateCommandOptions {
  dataDir: string;
}

export async function validateCommand(options: ValidateCommandOptions): Promise<void> {
  const db = await openDatabase(options.dataDir);

  try {
    const isValid = await validate(db);
    if (!isValid) {
      // Throw error to ensure process exits with non-zero status code for CI/CD and scripts
      throw new Error("Validation failed");
    }
  } finally {
    await db.close();
  }
}
