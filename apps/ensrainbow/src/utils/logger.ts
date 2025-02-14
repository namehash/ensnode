import { LogLevel, Logger, getLogger as createLogger } from "@ensnode/utils/logger";

let ensrainbowLogger: Logger | undefined;

export function getLogger(options?: { level?: LogLevel }): Logger {
  if (!ensrainbowLogger) {
    ensrainbowLogger = createLogger({ level: options?.level }).child({
      module: "ensrainbow",
    });
  }
  return ensrainbowLogger;
}
