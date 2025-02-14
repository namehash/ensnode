import { join } from "path";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { ingestCommand } from "./commands/ingest-command";
import { serverCommand } from "./commands/server-command";
import { validateCommand } from "./commands/validate-command";
import { getDataDir } from "./lib/database";
import { LogLevel, LOG_LEVELS } from "@ensnode/utils/logger";
import { getLogger } from "./utils/logger";

function getDefaultLogLevel(): LogLevel {
  const envLogLevel = process.env.LOG_LEVEL as LogLevel;
  return envLogLevel || "info";
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
          description: "Log level (fatal, error, warn, info, debug, trace)",
          choices: LOG_LEVELS,
          default: getDefaultLogLevel(),
        });
    },
    async (argv: ArgumentsCamelCase<IngestArgs>) => {
      getLogger({ level: argv["log-level"] });
      await ingestCommand({
        inputFile: argv["input-file"],
        dataDir: argv["data-dir"]
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
          default: 3223,
        })
        .option("data-dir", {
          type: "string",
          description: "Directory containing LevelDB data",
          default: getDataDir(),
        })
        .option("log-level", {
          type: "string",
          description: "Log level (fatal, error, warn, info, debug, trace)",
          choices: LOG_LEVELS,
          default: getDefaultLogLevel(),
        });
    },
    async (argv: ArgumentsCamelCase<ServeArgs>) => {
      getLogger({ level: argv["log-level"] });
      await serverCommand({
        port: argv.port,
        dataDir: argv["data-dir"]
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
          description: "Log level (fatal, error, warn, info, debug, trace)",
          choices: LOG_LEVELS,
          default: getDefaultLogLevel(),
        });
    },
    async (argv: ArgumentsCamelCase<ValidateArgs>) => {
      getLogger({ level: argv["log-level"] });
      await validateCommand({
        dataDir: argv["data-dir"]
      });
    },
  )
  .demandCommand(1, "You must specify a command")
  .strict()
  .help()
  .parse();
