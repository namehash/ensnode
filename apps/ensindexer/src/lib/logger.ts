// This file was copied 1-to-1 from ENSApi.
import pino from "pino";

import { getLogLevelFromEnv, type LogLevel } from "@ensnode/ensnode-sdk/internal";

const DEFAULT_LOG_LEVEL: LogLevel = "info";

const logger = pino({
  level: getLogLevelFromEnv({ LOG_LEVEL: process.env.LOG_LEVEL }, DEFAULT_LOG_LEVEL),
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
          },
        },
});

export const makeLogger = (scope: string) => logger.child({ scope });

export default logger;
