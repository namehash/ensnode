import pino from "pino";
import { DEFAULT_LOG_LEVEL, LogLevel, VALID_LOG_LEVELS } from "./config";
import { getLogLevel, isProduction } from "./env-utils";
import { parseLogLevel } from "./parsing-utils";

/**
 * Creates a logger with the specified log level
 *
 * @param level The log level to use
 * @returns A configured pino logger
 */
export function createLogger(level: LogLevel = DEFAULT_LOG_LEVEL): pino.Logger {
  const isProd = isProduction();

  return pino({
    level,
    ...(isProd
      ? {} // in production, use default pino output format
      : {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          },
        }),
  });
}

// create and export the global logger instance
export const logger = (() => {
  try {
    return createLogger(getLogLevel());
  } catch (error) {
    // log error to console since we can't use logger yet
    const errorMessage = `Environment variable error: (LOG_LEVEL): ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    // fall back to default log level
    return createLogger(DEFAULT_LOG_LEVEL);
  }
})();

// re-export types and constants for convenience
export { LogLevel, DEFAULT_LOG_LEVEL, VALID_LOG_LEVELS, parseLogLevel };
