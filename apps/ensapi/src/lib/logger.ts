import pino from "pino";

import { getLogLevelFromEnv, type LogLevel } from "@ensnode/ensnode-sdk/internal";

const DEFAULT_LOG_LEVEL: LogLevel = "info";

export default pino({
  level: getLogLevelFromEnv(process.env, DEFAULT_LOG_LEVEL),
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
