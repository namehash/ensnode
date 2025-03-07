import { constants, accessSync, existsSync } from "fs";
import { join } from "path";

// default port for the ENSRainbow server
export const DEFAULT_PORT = 3223;

// default data directory relative to the current working directory
export const DEFAULT_DATA_DIR = "data";

// default input file name for ingestion
export const DEFAULT_INPUT_FILE = "ens_names.sql.gz";

/**
 * Gets the default data directory path
 */
export const getDefaultDataDir = (): string => join(process.cwd(), DEFAULT_DATA_DIR);

/**
 * Gets the default input file path
 */
export const getDefaultInputFile = (): string => join(process.cwd(), DEFAULT_INPUT_FILE);

/**
 * Parses a string value from an environment variable
 *
 * @param envVarName The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @param validator Optional validation function that should return:
 *                  - true if validation passes
 *                  - false if validation fails (a generic error message will be used)
 *                  - a string with a custom error message if validation fails
 * @returns The parsed string value
 * @throws Error if validation fails or if the environment variable is not set and no default is provided
 */
export const getEnvString = (
  envVarName: string,
  defaultValue?: string,
  validator?: (value: string) => boolean | string,
): string => {
  const rawValue = process.env[envVarName];

  // if no value is provided, return the default or throw an error
  if (rawValue === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(
      `Environment variable '${envVarName}' is not set and no default value was provided.`,
    );
  }

  // if a validator is provided, run it
  if (validator) {
    const validationResult = validator(rawValue);
    if (validationResult !== true) {
      const errorMessage =
        typeof validationResult === "string"
          ? validationResult
          : `Invalid value '${rawValue}' for environment variable '${envVarName}'.`;
      throw new Error(errorMessage);
    }
  }

  return rawValue;
};

/**
 * Parses a non-negative integer from an environment variable
 *
 * @param envVarName The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The parsed non-negative integer
 * @throws Error if the value is not a valid non-negative integer
 */
export const getEnvNonNegativeNumber = (envVarName: string, defaultValue?: number): number => {
  const rawValue = process.env[envVarName];

  // if no value is provided, return the default or throw an error
  if (rawValue === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(
      `Environment variable '${envVarName}' is not set and no default value was provided.`,
    );
  }

  try {
    return parseNonNegativeInteger(rawValue);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Invalid value for environment variable '${envVarName}': ${error.message}`);
    }
    throw error;
  }
};

/**
 * Parses a file path from an environment variable and optionally validates that the file exists and is readable
 *
 * @param envVarName The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @param should_exist Whether to check if the file exists (default: true)
 * @param should_be_readable Whether to check if the file is readable (default: true)
 * @returns The parsed file path
 * @throws Error if the file does not exist (when should_exist is true) or is not readable (when should_be_readable is true)
 */
export const getEnvFilePath = (
  envVarName: string,
  defaultValue?: string,
  should_exist: boolean = true,
  should_be_readable: boolean = true,
): string => {
  const filePath = getEnvString(envVarName, defaultValue);

  // Always check if the file exists (for test verification), but only throw if should_exist is true
  const fileExists = existsSync(filePath);
  if (should_exist && !fileExists) {
    throw new Error(
      `File specified by environment variable '${envVarName}' does not exist: '${filePath}'. ` +
        `Please check that the file exists and the path is correct.`,
    );
  }

  // Check if the file is readable only if it exists and should_be_readable is true
  if (fileExists && should_exist && should_be_readable) {
    try {
      accessSync(filePath, constants.R_OK);
    } catch (error) {
      throw new Error(
        `File specified by environment variable '${envVarName}' is not readable: '${filePath}'. ` +
          `Please check file permissions.`,
      );
    }
  }

  return filePath;
};

/**
 * Parses a directory path from an environment variable and validates that the directory exists
 *
 * @param envVarName The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @param allowNonExistent Whether to allow the directory to not exist
 * @returns The parsed directory path
 * @throws Error if the directory does not exist and allowNonExistent is false
 */
export const getEnvDirPath = (
  envVarName: string,
  defaultValue?: string,
  allowNonExistent: boolean = false,
): string => {
  const dirPath = getEnvString(envVarName, defaultValue);

  // check if the directory exists
  if (!existsSync(dirPath)) {
    if (allowNonExistent) {
      // directory will be created when needed
      return dirPath;
    }

    throw new Error(
      `Directory specified by environment variable '${envVarName}' does not exist: '${dirPath}'. ` +
        `Please check that the directory exists and the path is correct.`,
    );
  }

  return dirPath;
};

/**
 * Parses a port number from an environment variable
 *
 * @param envVarName The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The parsed port number
 * @throws Error if the value is not a valid port number
 */
export const getEnvPort = (
  envVarName: string = "PORT",
  defaultValue: number = DEFAULT_PORT,
): number => {
  const port = getEnvNonNegativeNumber(envVarName, defaultValue);

  // check if the port is in a valid range
  if (port < 0 || port > 65535) {
    throw new Error(
      `Invalid port number '${port}' specified by environment variable '${envVarName}'. ` +
        `Port must be between 0 and 65535.`,
    );
  }

  return port;
};

/**
 * Gets the data directory path from the DATA_DIR environment variable
 *
 * @returns The data directory path
 */
export const getDataDir = (): string => {
  return getEnvDirPath("DATA_DIR", getDefaultDataDir(), true);
};

/**
 * Gets the input file path from the INPUT_FILE environment variable
 *
 * @param should_exist Whether to check if the file exists (default: true)
 * @param should_be_readable Whether to check if the file is readable (default: true)
 * @returns The input file path
 */
export const getInputFile = (
  should_exist: boolean = true,
  should_be_readable: boolean = true,
): string => {
  return getEnvFilePath("INPUT_FILE", getDefaultInputFile(), should_exist, should_be_readable);
};

/**
 * Gets the port number from the PORT environment variable
 *
 * @returns The port number
 */
export const getPort = (): number => {
  return getEnvPort("PORT", DEFAULT_PORT);
};

/**
 * Parses a non-negative integer from a string
 *
 * @param maybeNumber The string to parse
 * @returns The parsed non-negative integer
 * @throws Error if the value is not a valid non-negative integer
 */
export function parseNonNegativeInteger(maybeNumber: string): number {
  const trimmed = maybeNumber.trim();

  // check for empty strings
  if (!trimmed) {
    throw new Error("Input cannot be empty");
  }

  // check for -0
  if (trimmed === "-0") {
    throw new Error("Negative zero is not a valid non-negative integer");
  }

  const num = Number(maybeNumber);

  // check if it's not a number
  if (Number.isNaN(num)) {
    throw new Error(`"${maybeNumber}" is not a valid number`);
  }

  // check if it's not finite
  if (!Number.isFinite(num)) {
    throw new Error(`"${maybeNumber}" is not a finite number`);
  }

  // check if it's not an integer
  if (!Number.isInteger(num)) {
    throw new Error(`"${maybeNumber}" is not an integer`);
  }

  // check if it's negative
  if (num < 0) {
    throw new Error(`"${maybeNumber}" is not a non-negative integer`);
  }

  return num;
}
