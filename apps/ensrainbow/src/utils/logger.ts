export interface Logger {
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export type LogLevel = "error" | "warn" | "info" | "debug";

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

export function createLogger(level: LogLevel = "info"): Logger {
  const currentLogLevel = logLevels[level];

  return {
    error: (...args: any[]) => {
      if (currentLogLevel >= logLevels.error) console.error(...args);
    },
    warn: (...args: any[]) => {
      if (currentLogLevel >= logLevels.warn) console.warn(...args);
    },
    info: (...args: any[]) => {
      if (currentLogLevel >= logLevels.info) console.log(...args);
    },
    debug: (...args: any[]) => {
      if (currentLogLevel >= logLevels.debug) console.debug(...args);
    },
  };
}
