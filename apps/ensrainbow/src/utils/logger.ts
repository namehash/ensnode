import pino, { LevelWithSilent } from "pino";

export type LogLevel = LevelWithSilent;

export const DEFAULT_LOG_LEVEL: LogLevel = "info";

// Creating our own definition of the log levels recognized by Pino
// to provide a better user experience with clear error messages when invalid log levels are
// parsed.
export const VALID_LOG_LEVELS: LogLevel[] = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
];

export function parseLogLevel(maybeLevel: string): LogLevel {
  const normalizedLevel = maybeLevel.toLowerCase();
  if (VALID_LOG_LEVELS.includes(normalizedLevel as LogLevel)) {
    return normalizedLevel as LogLevel;
  }
  throw new Error(
    `Invalid log level "${maybeLevel}". Valid levels are: ${VALID_LOG_LEVELS.join(", ")}.`,
  );
}

export function getEnvLogLevel(): LogLevel {
  const envLogLevel = process.env.LOG_LEVEL;
  if (!envLogLevel) {
    return DEFAULT_LOG_LEVEL;
  }

  try {
    return parseLogLevel(envLogLevel);
  } catch (error: unknown) {
    const errorMessage = `Environment variable error: (LOG_LEVEL): ${error instanceof Error ? error.message : String(error)}`;
    // Log error to console since we can't use logger yet
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export function createLogger(level: LogLevel = DEFAULT_LOG_LEVEL): pino.Logger {
  const isProduction = true; //process.env.NODE_ENV === "production";

  return pino({
    level,
    ...(isProduction
      ? {} // In production, use default pino output format
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

// Create and export the global logger instance
export const logger = createLogger(getEnvLogLevel());

// Re-export pino types for convenience
export type { Logger } from "pino";
