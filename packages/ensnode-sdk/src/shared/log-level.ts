import { z } from "zod/v4";

import type { LogLevelEnvironment } from "./config/environments";

/**
 * Set of valid log levels, mirroring pino#LogLevelWithSilent.
 */
const LogLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

export type LogLevel = z.infer<typeof LogLevelSchema>;

export function getLogLevelFromEnv(env: LogLevelEnvironment, defaultLogLevel: LogLevel): LogLevel {
  try {
    return LogLevelSchema.default(defaultLogLevel).parse(env.LOG_LEVEL);
  } catch {
    console.warn(
      `Invalid LOG_LEVEL '${env.LOG_LEVEL}', expected one of '${Object.values(LogLevelSchema.enum).join("' | '")}' defaulting to '${defaultLogLevel}'`,
    );
    return defaultLogLevel;
  }
}
