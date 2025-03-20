import { join } from "path";
import {
  DEFAULT_DATA_DIR,
  DEFAULT_INPUT_FILE,
  DEFAULT_LOG_LEVEL,
  DEFAULT_PORT,
  LogLevel,
} from "./config";
import {
  parseDirPath,
  parseFilePath,
  parseLogLevel,
  parseNonNegativeInteger,
  parsePort,
} from "./parsing-utils";

/**
 * Gets the default data directory path
 */
export const getDefaultDataDir = (): string => join(process.cwd(), DEFAULT_DATA_DIR);

/**
 * Gets the default input file path
 */
export const getDefaultInputFile = (): string => join(process.cwd(), DEFAULT_INPUT_FILE);

/**
 * Checks if an error message already has the environment variable error prefix
 *
 * @param error The error to check
 * @returns True if the error already has the environment variable error prefix
 */
function isEnvVarError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.startsWith("Environment variable error:");
  }
  return false;
}

/**
 * Formats an error message with the environment variable error prefix
 *
 * @param envVarName The name of the environment variable
 * @param error The error to format
 * @returns The formatted error message
 */
function formatEnvVarError(envVarName: string, error: unknown): string {
  if (isEnvVarError(error)) {
    // Don't add another prefix if it's already an environment variable error
    return error instanceof Error ? error.message : String(error);
  }
  return `Environment variable error: (${envVarName}): ${error instanceof Error ? error.message : String(error)}`;
}

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
  try {
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
  } catch (error) {
    const errorMessage = formatEnvVarError(envVarName, error);
    throw new Error(errorMessage);
  }
};

/**
 * Parses a non-negative integer from an environment variable
 *
 * @param envVarName The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The parsed non-negative integer
 * @throws Error if the value is not a valid non-negative integer
 */
export const getEnvNonNegativeInteger = (envVarName: string, defaultValue?: number): number => {
  try {
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

    return parseNonNegativeInteger(rawValue);
  } catch (error) {
    const errorMessage = formatEnvVarError(envVarName, error);
    throw new Error(errorMessage);
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
  try {
    const filePath = getEnvString(envVarName, defaultValue);

    return parseFilePath(filePath, should_exist, should_be_readable);
  } catch (error) {
    const errorMessage = formatEnvVarError(envVarName, error);
    throw new Error(errorMessage);
  }
};

/**
 * Parses a directory path from an environment variable and optionally validates that the directory exists
 *
 * @param envVarName The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @param allowNonExistent Whether to allow the directory to not exist (default: false)
 * @returns The parsed directory path
 * @throws Error if the directory does not exist and allowNonExistent is false
 */
export const getEnvDirPath = (
  envVarName: string,
  defaultValue?: string,
  allowNonExistent: boolean = false,
): string => {
  try {
    const dirPath = getEnvString(envVarName, defaultValue);

    return parseDirPath(dirPath, allowNonExistent);
  } catch (error) {
    const errorMessage = formatEnvVarError(envVarName, error);
    throw new Error(errorMessage);
  }
};

/**
 * Parses a port number from an environment variable
 *
 * @param envVarName The name of the environment variable
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The parsed port number
 * @throws Error if the port is not a valid port number
 */
export const getEnvPort = (
  envVarName: string = "PORT",
  defaultValue: number = DEFAULT_PORT,
): number => {
  try {
    const port = getEnvNonNegativeInteger(envVarName, defaultValue);

    return parsePort(port);
  } catch (error) {
    const errorMessage = formatEnvVarError(envVarName, error);
    throw new Error(errorMessage);
  }
};

/**
 * Gets the data directory path from the DATA_DIR environment variable, falling back to the default data directory path
 *
 * @returns The data directory path
 */
export const getDataDir = (): string => {
  return getEnvDirPath("DATA_DIR", getDefaultDataDir(), true);
};

/**
 * Gets the input file path from the INPUT_FILE environment variable, falling back to the default input file path
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
 * Gets the log level from the LOG_LEVEL environment variable
 */
export const getLogLevel = (): LogLevel => {
  const rawValue = process.env.LOG_LEVEL;
  if (!rawValue) {
    return DEFAULT_LOG_LEVEL;
  }

  try {
    return parseLogLevel(rawValue);
  } catch (error) {
    const errorMessage = formatEnvVarError("LOG_LEVEL", error);
    throw new Error(errorMessage);
  }
};

/**
 * Checks if the current environment is production
 *
 * @returns True if the environment is production, false otherwise
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

/**
 * Validates that there is no conflict between the port specified in the environment
 * variable and the port specified in the command-line arguments
 *
 * @param cliPort The port specified in the command-line arguments
 * @throws Error if there is a conflict between the environment variable and command-line argument
 */
export function validatePortConfiguration(cliPort: number): void {
  const envPort = getPort();

  if (envPort !== DEFAULT_PORT && cliPort !== envPort) {
    throw new Error(
      `Port conflict: Command line argument (${cliPort}) differs from PORT environment variable (${envPort}). ` +
        `Please use only one method to specify the port.`,
    );
  }
}
