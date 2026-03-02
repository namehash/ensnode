import { accessSync, constants, statSync } from "node:fs";

const INPUT_FILE_ERROR_MESSAGE =
  "Input file not found or not readable. Please ensure the file exists and you have read permission.";

/**
 * Validates that the given path is a readable file. Use before opening input streams
 * in convert/ingest commands to fail fast with a clear error.
 * @param path - Absolute or relative path to the input file
 * @throws Error with a user-friendly message if the file does not exist or is not readable
 */
export function assertInputFileReadable(path: string): void {
  let stats: ReturnType<typeof statSync>;
  try {
    stats = statSync(path);
  } catch {
    throw new Error(`${path}: ${INPUT_FILE_ERROR_MESSAGE}`);
  }

  if (!stats.isFile()) {
    throw new Error(`Input path is not a file: ${path}.`);
  }

  try {
    accessSync(path, constants.R_OK);
  } catch {
    throw new Error(`${path}: ${INPUT_FILE_ERROR_MESSAGE}`);
  }
}
