import pino from "pino";

export const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

let globalLogger: pino.Logger | undefined;

export function getLogger(options?: { level?: LogLevel }): pino.Logger {
  if (!globalLogger) {
    globalLogger = pino({
      level: process.env.LOG_LEVEL || options?.level || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    });
  }

  if (options?.level && options.level !== globalLogger.level) {
    globalLogger = globalLogger.child({ level: options.level });
  }

  return globalLogger;
}

// Re-export pino types for convenience
export type { Logger } from "pino";
