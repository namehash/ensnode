import pino from "pino";

export const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const DEFAULT_LOG_LEVEL: LogLevel = "info";

export function parseLogLevel(level: string): LogLevel {
  const normalizedLevel = level.toLowerCase();
  if (LOG_LEVELS.includes(normalizedLevel as LogLevel)) {
    return normalizedLevel as LogLevel;
  }
  throw new Error(
    `Invalid log level "${level}". Valid levels are: ${LOG_LEVELS.join(", ")}`
  );
}

export function getEnvLogLevel(): LogLevel {
  const envLogLevel = process.env.LOG_LEVEL;
  if (!envLogLevel) {
    return DEFAULT_LOG_LEVEL;
  }

  try {
    return parseLogLevel(envLogLevel);
  } catch (error) {
    // Log error to console since we can't use logger yet
    console.error(
      `Invalid LOG_LEVEL environment variable value "${envLogLevel}". Valid levels are: ${LOG_LEVELS.join(
        ", "
      )}. Defaulting to "${DEFAULT_LOG_LEVEL}".`
    );
    return DEFAULT_LOG_LEVEL;
  }
}

export function createLogger(level: LogLevel = DEFAULT_LOG_LEVEL): pino.Logger {
  const isProduction = process.env.NODE_ENV === 'production';

  return pino({
    level,
    ...(isProduction
      ? {} // In production, use default pino output format
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }),
  });
}

// Create and export the global logger instance
export const logger = createLogger(getEnvLogLevel());

// Re-export pino types for convenience
export type { Logger } from "pino";
