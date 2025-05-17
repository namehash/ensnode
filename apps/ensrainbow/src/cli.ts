import { join } from "path";
import { resolve } from "path";
import { fileURLToPath } from "url";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { ingestCommand } from "./commands/ingest-command";
import { purgeCommand } from "./commands/purge-command";
import { serverCommand } from "./commands/server-command";
import { validateCommand } from "./commands/validate-command";
import { resolveDirPath, resolveFilePath, resolvePort } from "./utils/command-utils";
import { DEFAULT_PORT } from "./utils/config";
import { getDataDir, getInputFile, validatePortConfiguration } from "./utils/env-utils";

interface IngestArgs {
  "input-file": string | undefined;
  "data-dir": string | undefined;
}

interface ServeArgs {
  port: number | undefined;
  "data-dir": string | undefined;
}

interface ValidateArgs {
  "data-dir": string | undefined;
  lite: boolean;
}

interface PurgeArgs {
  "data-dir": string | undefined;
}

export interface CLIOptions {
  exitProcess?: boolean;
}

export function createCLI(options: CLIOptions = {}) {
  const { exitProcess = true } = options;

  return yargs()
    .scriptName("ensrainbow")
    .exitProcess(exitProcess)
    .command(
      "ingest",
      "Ingest labels from SQL dump into LevelDB",
      (yargs: Argv) => {
        return yargs
          .option("input-file", {
            type: "string",
            description:
              "Path to the gzipped SQL dump file (default: from INPUT_FILE env var or config)",
          })
          .option("data-dir", {
            type: "string",
            description:
              "Directory to store LevelDB data (default: from DATA_DIR env var or config)",
          });
      },
      async (argv: ArgumentsCamelCase<IngestArgs>) => {
        const inputFile = resolveFilePath(argv["input-file"], "INPUT_FILE", getInputFile());
        const dataDir = resolveDirPath(argv["data-dir"], "DATA_DIR", getDataDir(), true);

        await ingestCommand({
          inputFile,
          dataDir,
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
            description: "Port to listen on (default: from PORT env var or config)",
          })
          .option("data-dir", {
            type: "string",
            description:
              "Directory containing LevelDB data (default: from DATA_DIR env var or config)",
          });
      },
      async (argv: ArgumentsCamelCase<ServeArgs>) => {
        // validate port configuration if CLI argument is provided
        if (argv.port !== undefined) {
          validatePortConfiguration(argv.port);
        }

        const port = resolvePort(argv.port, "PORT", DEFAULT_PORT);
        const dataDir = resolveDirPath(argv["data-dir"], "DATA_DIR", getDataDir());

        await serverCommand({
          port,
          dataDir,
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
            description:
              "Directory containing LevelDB data (default: from DATA_DIR env var or config)",
          })
          .option("lite", {
            type: "boolean",
            description:
              "Perform a faster, less thorough validation by skipping hash verification and record count validation",
            default: false,
          });
      },
      async (argv: ArgumentsCamelCase<ValidateArgs>) => {
        const dataDir = resolveDirPath(argv["data-dir"], "DATA_DIR", getDataDir());

        await validateCommand({
          dataDir,
          lite: argv.lite,
        });
      },
    )
    .command(
      "purge",
      "Completely wipe all files from the specified data directory",
      (yargs: Argv) => {
        return yargs.option("data-dir", {
          type: "string",
          description:
            "Directory containing LevelDB data (default: from DATA_DIR env var or config)",
        });
      },
      async (argv: ArgumentsCamelCase<PurgeArgs>) => {
        const dataDir = resolveDirPath(argv["data-dir"], "DATA_DIR", getDataDir(), true);
        await purgeCommand({ dataDir });
      },
    )
    .demandCommand(1, "You must specify a command")
    .strict()
    .help();
}

// Only execute if this is the main module
const isMainModule = resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  createCLI().parse(hideBin(process.argv));
}
