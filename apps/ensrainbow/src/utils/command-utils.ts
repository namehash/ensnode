import { LogLevel } from "./config";
import { getEnvDirPath, getEnvFilePath, getEnvPort } from "./env-utils";
import { parseDirPath, parseFilePath, parseLogLevel, parsePort } from "./parsing-utils";

/**
 * Formats an error message for command-line arguments
 *
 * @param argName The name of the command-line argument
 * @param error The error to format
 * @returns The formatted error message
 */
function formatCommandArgError(argName: string, error: unknown): string {
  return `Command argument error: (${argName}): ${error instanceof Error ? error.message : String(error)}`;
}

/**
 * Parses a file path from a command-line argument
 *
 * @param filePath The file path to parse
 * @param should_exist Whether to check if the file exists (default: true)
 * @param should_be_readable Whether to check if the file is readable (default: true)
 * @returns The parsed file path
 * @throws Error if the file does not exist or is not readable
 */
export function parseCliFilePath(
  filePath: string,
  should_exist: boolean = true,
  should_be_readable: boolean = true,
): string {
  try {
    return parseFilePath(filePath, should_exist, should_be_readable);
  } catch (error) {
    const errorMessage = formatCommandArgError("filePath", error);
    throw new Error(errorMessage);
  }
}

/**
 * Parses a directory path from a command-line argument
 *
 * @param dirPath The directory path to parse
 * @param allowNonExistent Whether to allow the directory to not exist (default: false)
 * @returns The parsed directory path
 * @throws Error if the directory does not exist and allowNonExistent is false
 */
export function parseCliDirPath(dirPath: string, allowNonExistent: boolean = false): string {
  try {
    return parseDirPath(dirPath, allowNonExistent);
  } catch (error) {
    const errorMessage = formatCommandArgError("dirPath", error);
    throw new Error(errorMessage);
  }
}

/**
 * Parses a port number from a command-line argument
 *
 * @param port The port number to parse
 * @returns The parsed port number
 * @throws Error if the port is not a valid port number
 */
export function parseCliPort(port: number): number {
  try {
    return parsePort(port);
  } catch (error) {
    const errorMessage = formatCommandArgError("port", error);
    throw new Error(errorMessage);
  }
}

/**
 * Resolves a file path from a command-line argument or environment variable
 * Command-line argument takes precedence over environment variable
 *
 * @param cliPath The file path from the command-line argument
 * @param envVarName The name of the environment variable
 * @param defaultValue The default value to use if neither the command-line argument nor the environment variable is set
 * @param should_exist Whether to check if the file exists (default: true)
 * @param should_be_readable Whether to check if the file is readable (default: true)
 * @returns The resolved file path
 */
export function resolveFilePath(
  cliPath: string | undefined,
  envVarName: string,
  defaultValue?: string,
  should_exist: boolean = true,
  should_be_readable: boolean = true,
): string {
  // command-line argument takes precedence
  if (cliPath !== undefined) {
    return parseCliFilePath(cliPath, should_exist, should_be_readable);
  }

  // fall back to environment variable
  return getEnvFilePath(envVarName, defaultValue, should_exist, should_be_readable);
}

/**
 * Resolves a directory path from a command-line argument or environment variable
 * Command-line argument takes precedence over environment variable
 *
 * @param cliPath The directory path from the command-line argument
 * @param envVarName The name of the environment variable
 * @param defaultValue The default value to use if neither the command-line argument nor the environment variable is set
 * @param allowNonExistent Whether to allow the directory to not exist (default: false)
 * @returns The resolved directory path
 */
export function resolveDirPath(
  cliPath: string | undefined,
  envVarName: string,
  defaultValue?: string,
  allowNonExistent: boolean = false,
): string {
  // command-line argument takes precedence
  if (cliPath !== undefined) {
    return parseCliDirPath(cliPath, allowNonExistent);
  }

  // fall back to environment variable
  return getEnvDirPath(envVarName, defaultValue, allowNonExistent);
}

/**
 * Resolves a port number from a command-line argument or environment variable
 * Command-line argument takes precedence over environment variable
 *
 * @param cliPort The port number from the command-line argument
 * @param envVarName The name of the environment variable
 * @param defaultValue The default value to use if neither the command-line argument nor the environment variable is set
 * @returns The resolved port number
 */
export function resolvePort(
  cliPort: number | undefined,
  envVarName: string,
  defaultValue?: number,
): number {
  // command-line argument takes precedence
  if (cliPort !== undefined) {
    return parseCliPort(cliPort);
  }

  // fall back to environment variable
  return getEnvPort(envVarName, defaultValue);
}

/**
 * Resolves a log level from a command-line argument or environment variable
 * Command-line argument takes precedence over environment variable
 *
 * @param cliLogLevel The log level from the command-line argument
 * @param envVarName The name of the environment variable
 * @param defaultValue The default value to use if neither the command-line argument nor the environment variable is set
 * @returns The resolved log level
 */
export function resolveLogLevel(
  cliLogLevel: string | undefined,
  envVarName: string,
  defaultValue?: LogLevel,
): LogLevel {
  // command-line argument takes precedence
  if (cliLogLevel !== undefined) {
    try {
      return parseLogLevel(cliLogLevel);
    } catch (error) {
      const errorMessage = formatCommandArgError("logLevel", error);
      throw new Error(errorMessage);
    }
  }

  // fall back to environment variable
  const envLogLevel = process.env[envVarName];
  if (envLogLevel !== undefined) {
    try {
      return parseLogLevel(envLogLevel);
    } catch (error) {
      throw new Error(
        `Environment variable error: (${envVarName}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // fall back to default value
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  throw new Error(`No log level specified and no default value provided.`);
}
