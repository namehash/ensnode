import { join } from "path";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { ingestCommand } from "./commands/ingest-command";
import { DEFAULT_PORT, serverCommand } from "./commands/server-command";
import { validateCommand } from "./commands/validate-command";
import { getDataDir } from "./lib/database";
import { LogLevel, VALID_LOG_LEVELS } from "./utils/logger";
import { parseNonNegativeInteger } from "./utils/number-utils";

function getDefaultLogLevel(): LogLevel {
  const envLogLevel = process.env.LOG_LEVEL as LogLevel;
  return envLogLevel && VALID_LOG_LEVELS.includes(envLogLevel) ? envLogLevel : "info";
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
    console.error(errorMessage); //TODO: Use logger?
    throw new Error(errorMessage);
  }
}

function validatePortConfiguration(cliPort: number): void {
  const envPort = process.env.PORT;
  if (envPort !== undefined && cliPort !== getEnvPort()) {
    throw new Error(
      `Port conflict: Command line argument (${cliPort}) differs from PORT environment variable (${envPort}). ` +
        `Please use only one method to specify the port.`,
    );
  }
}

interface IngestArgs {
  "input-file": string;
  "data-dir": string;
}

interface ServeArgs {
  port: number;
  "data-dir": string;
}

interface ValidateArgs {
  "data-dir": string;
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
        });
    },
    async (argv: ArgumentsCamelCase<IngestArgs>) => {
      await ingestCommand({
        inputFile: argv["input-file"],
        dataDir: argv["data-dir"],
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
        });
    },
    async (argv: ArgumentsCamelCase<ServeArgs>) => {
      validatePortConfiguration(argv.port);
      await serverCommand({
        port: argv.port,
        dataDir: argv["data-dir"],
      });
    },
  )
  .command(
    "validate",
    "Validate the integrity of the LevelDB database",
    (yargs: Argv) => {
      return yargs.option("data-dir", {
        type: "string",
        description: "Directory containing LevelDB data",
        default: getDataDir(),
      });
    },
    async (argv: ArgumentsCamelCase<ValidateArgs>) => {
      await validateCommand({
        dataDir: argv["data-dir"],
      });
    },
  )
  .demandCommand(1, "You must specify a command")
  .strict()
  .help()
  .parse();
