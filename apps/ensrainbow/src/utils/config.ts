import type { LevelWithSilent } from "pino";

// log level configuration
export type LogLevel = LevelWithSilent;
export const VALID_LOG_LEVELS: LogLevel[] = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
];

// default log level
export const DEFAULT_LOG_LEVEL: LogLevel = "info";

// default port for the ENSRainbow server
export const DEFAULT_PORT = 3223;

// default data directory relative to the current working directory
export const DEFAULT_DATA_DIR = "data";

// default input file name for ingestion
export const DEFAULT_INPUT_FILE = "ens_names.sql.gz";
