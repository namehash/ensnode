import { join } from "path";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { ingestCommand } from "./commands/ingest-command";
import { serverCommand } from "./commands/server-command";
import { getDataDir } from "./lib/database";
import { LogLevel, logLevels } from "./utils/logger";

function getDefaultLogLevel(): LogLevel {
  const envLogLevel = process.env.LOG_LEVEL as LogLevel;
  return envLogLevel && envLogLevel in logLevels ? envLogLevel : "info";
}

interface IngestArgs {
  "input-file": string;
  "data-dir": string;
  "validate-hashes": boolean;
  "log-level": LogLevel;
}

interface ServeArgs {
  port: number;
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
        .option("validate-hashes", {
          type: "boolean",
          description: "Validate that stored labelhashes match computed hashes",
          default: false,
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
        validateHashes: argv["validate-hashes"],
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
          default: 3001,
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
  .demandCommand(1, "You must specify a command")
  .strict()
  .help()
  .parse();
