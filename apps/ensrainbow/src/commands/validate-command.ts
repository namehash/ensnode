import { ENSRainbowDB } from "../lib/database";

export interface ValidateCommandOptions {
  dataDir: string;
}

export async function validateCommand(options: ValidateCommandOptions): Promise<void> {
  const db = await ENSRainbowDB.open(options.dataDir);

  try {
    const isValid = await db.validate();
    if (!isValid) {
      // Throw error to ensure process exits with non-zero status code for CI/CD and scripts
      throw new Error("Validation failed");
    }
  } finally {
    await db.close();
  }
}
