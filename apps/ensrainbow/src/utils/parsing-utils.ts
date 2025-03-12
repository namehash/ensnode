import { constants, accessSync, existsSync } from "fs";
import { LogLevel, VALID_LOG_LEVELS } from "./config";

/**
 * Parses a non-negative integer from a string
 *
 * @param maybeNumber The string to parse
 * @returns The parsed non-negative integer
 * @throws Error if the string is not a valid non-negative integer
 */
export function parseNonNegativeInteger(maybeNumber: string): number {
  const trimmed = maybeNumber.trim();

  if (trimmed === "") {
    throw new Error("Input cannot be empty");
  }

  // check for negative zero
  if (trimmed === "-0") {
    throw new Error("Negative zero is not a valid non-negative integer");
  }

  // parse the number
  const num = Number(trimmed);

  // check if it's a valid number
  if (isNaN(num)) {
    throw new Error(`"${trimmed}" is not a valid number`);
  }

  // check if it's finite
  if (!isFinite(num)) {
    throw new Error(`"${trimmed}" is not a finite number`);
  }

  // check if it's an integer
  if (!Number.isInteger(num)) {
    throw new Error(`"${trimmed}" is not an integer`);
  }

  // check if it's non-negative
  if (num < 0) {
    throw new Error(`"${trimmed}" is not a non-negative integer`);
  }

  return num;
}

/**
 * Parses a log level string
 *
 * @param maybeLevel The string to parse
 * @returns The parsed log level
 * @throws Error if the string is not a valid log level
 */
export function parseLogLevel(maybeLevel: string): LogLevel {
  const normalizedLevel = maybeLevel.toLowerCase();
  if (VALID_LOG_LEVELS.includes(normalizedLevel as LogLevel)) {
    return normalizedLevel as LogLevel;
  }
  throw new Error(
    `Invalid log level "${maybeLevel}". Valid levels are: ${VALID_LOG_LEVELS.join(", ")}.`,
  );
}

/**
 * Parses a file path
 *
 * @param filePath The file path to parse
 * @param should_exist Whether to check if the file exists (default: true)
 * @param should_be_readable Whether to check if the file is readable (default: true)
 * @returns The parsed file path
 * @throws Error if the file does not exist or is not readable
 */
export function parseFilePath(
  filePath: string,
  should_exist: boolean = true,
  should_be_readable: boolean = true,
): string {
  // always check if the file exists, but only throw if should_exist is true
  const fileExists = existsSync(filePath);
  if (should_exist && !fileExists) {
    throw new Error(`File '${filePath}' does not exist.`);
  }

  // check if the file is readable only if it exists and should_be_readable is true
  if (fileExists && should_exist && should_be_readable) {
    try {
      accessSync(filePath, constants.R_OK);
    } catch (error) {
      throw new Error(`File '${filePath}' is not readable.`);
    }
  }

  return filePath;
}

/**
 * Parses a directory path
 *
 * @param dirPath The directory path to parse
 * @param allowNonExistent Whether to allow the directory to not exist (default: false)
 * @returns The parsed directory path
 * @throws Error if the directory does not exist and allowNonExistent is false
 */
export function parseDirPath(dirPath: string, allowNonExistent: boolean = false): string {
  if (!allowNonExistent && !existsSync(dirPath)) {
    throw new Error(`Directory '${dirPath}' does not exist.`);
  }

  return dirPath;
}

/**
 * Parses a port number
 *
 * @param port The port number to parse
 * @returns The parsed port number
 * @throws Error if the port is not a valid port number
 */
export function parsePort(port: number): number {
  if (isNaN(port) || port < 0 || !Number.isInteger(port)) {
    throw new Error(`Invalid port number: ${port}. Port must be a non-negative integer.`);
  }

  if (port > 65535) {
    throw new Error(`Port number ${port} is out of range. Port must be between 0 and 65535.`);
  }

  return port;
}
