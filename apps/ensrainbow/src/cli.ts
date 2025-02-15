import { join } from "path";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { ingestCommand } from "./commands/ingest-command";
import { DEFAULT_PORT, serverCommand } from "./commands/server-command";
import { validateCommand } from "./commands/validate-command";
import { getDataDir } from "./lib/database";
import { LogLevel, logLevels } from "./utils/logger";
import { parseNonNegativeInteger } from "./utils/number-utils";

function getDefaultLogLevel(): LogLevel {
  const envLogLevel = process.env.LOG_LEVEL as LogLevel;
  return envLogLevel && envLogLevel in logLevels ? envLogLevel : "info";
}

function getEnvPort(): number {
  const envPort = process.env.PORT;
  if (!envPort) {
    return DEFAULT_PORT;
  }

  try {
    const port = parseNonNegativeInteger(envPort);
    if (port === null) {
      throw new Error(`Invalid port number "${envPort}". Port must be a non-negative integer.`);
    }
    return port;
  } catch (error: unknown) {
    const errorMessage = `Environment variable error: (PORT): ${error instanceof Error ? error.message : String(error)}`;
    // Log error to console since we can't use logger yet
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

interface IngestArgs {
  "input-file": string;
  "data-dir": string;
  "log-level": LogLevel;
}

interface ServeArgs {
  port: number;
  "data-dir": string;
  "log-level": LogLevel;
}

interface ValidateArgs {
  "data-dir": string;
  "log-level": LogLevel;
}

yargs(hideBin(process.argv))
  .scriptName("ensrainbow")
  .command(
    "ingest",
    "Ingest labels from SQL dump into LevelDB",
    (yargs: Argv) => {
      return yargs
        .option("input-file", {
          type: "string",
          description: "Path to the gzipped SQL dump file",
          default: join(process.cwd(), "ens_names.sql.gz"),
        })
        .option("data-dir", {
          type: "string",
          description: "Directory to store LevelDB data",
          default: getDataDir(),
        })
        .option("log-level", {
          type: "string",
          description: "Log level (error, warn, info, debug)",
          choices: Object.keys(logLevels),
          default: getDefaultLogLevel(),
        });
    },
    async (argv: ArgumentsCamelCase<IngestArgs>) => {
      await ingestCommand({
        inputFile: argv["input-file"],
        dataDir: argv["data-dir"],
        logLevel: argv["log-level"],
      });
    },
  )
  .command(
    "serve",
    "Start the ENS Rainbow API server",
    (yargs: Argv) => {
      return yargs
        .option("port", {
          type: "number",
          description: "Port to listen on",
          default: getEnvPort(),
        })
        .option("data-dir", {
          type: "string",
          description: "Directory containing LevelDB data",
          default: getDataDir(),
        })
        .option("log-level", {
          type: "string",
          description: "Log level (error, warn, info, debug)",
          choices: Object.keys(logLevels),
          default: getDefaultLogLevel(),
        });
    },
    async (argv: ArgumentsCamelCase<ServeArgs>) => {
      await serverCommand({
        port: argv.port,
        dataDir: argv["data-dir"],
        logLevel: argv["log-level"],
      });
    },
  )
  .command(
    "validate",
    "Validate the integrity of the LevelDB database",
    (yargs: Argv) => {
      return yargs
        .option("data-dir", {
          type: "string",
          description: "Directory containing LevelDB data",
          default: getDataDir(),
        })
        .option("log-level", {
          type: "string",
          description: "Log level (error, warn, info, debug)",
          choices: Object.keys(logLevels),
          default: getDefaultLogLevel(),
        });
    },
    async (argv: ArgumentsCamelCase<ValidateArgs>) => {
      await validateCommand({
        dataDir: argv["data-dir"],
        logLevel: argv["log-level"],
      });
    },
  )
  .demandCommand(1, "You must specify a command")
  .strict()
  .help()
  .parse();
