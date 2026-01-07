import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

import { buildLabelSetId, type LabelSetId } from "@ensnode/ensnode-sdk";

import { convertCommand } from "@/commands/convert-command-sql";
import { convertCsvCommand } from "@/commands/convert-csv-command";
// import { ingestCommand } from "@/commands/ingest-command";
import { ingestProtobufCommand } from "@/commands/ingest-protobuf-command";
import { purgeCommand } from "@/commands/purge-command";
import { serverCommand } from "@/commands/server-command";
import { validateCommand } from "@/commands/validate-command";
import { getDefaultDataSubDir, getEnvPort } from "@/lib/env";

export function validatePortConfiguration(cliPort: number): void {
  const envPort = process.env.PORT;
  if (envPort !== undefined && cliPort !== getEnvPort()) {
    throw new Error(
      `Port conflict: Command line argument (${cliPort}) differs from PORT environment variable (${envPort}). ` +
        `Please use only one method to specify the port.`,
    );
  }
}

// interface IngestArgs {
//   "input-file": string;
//   "data-dir": string;
// }

interface IngestProtobufArgs {
  "input-file": string;
  "data-dir": string;
}

interface ServeArgs {
  port: number;
  "data-dir": string;
}

interface ValidateArgs {
  "data-dir": string;
  lite: boolean;
}

interface PurgeArgs {
  "data-dir": string;
}

interface ConvertArgs {
  "input-file": string;
  "output-file"?: string;
  "label-set-id": LabelSetId;
}

interface ConvertCsvArgs {
  "input-file": string;
  "output-file"?: string;
  "label-set-id": LabelSetId;
  "progress-interval"?: number;
  "existing-db-path"?: string;
  silent?: boolean;
}

export interface CLIOptions {
  exitProcess?: boolean;
}

export function createCLI(options: CLIOptions = {}) {
  const { exitProcess = true } = options;

  return (
    yargs()
      .scriptName("ensrainbow")
      .exitProcess(exitProcess)
      // .command(
      //   "ingest",
      //   "Ingest labels from SQL dump into LevelDB",
      //   (yargs: Argv) => {
      //     return yargs
      //       .option("input-file", {
      //         type: "string",
      //         description: "Path to the gzipped SQL dump file",
      //         default: join(process.cwd(), "ens_names.sql.gz"),
      //       })
      //       .option("data-dir", {
      //         type: "string",
      //         description: "Directory to store LevelDB data",
      //         default: getDefaultDataSubDir(),
      //       });
      //   },
      //   async (argv: ArgumentsCamelCase<IngestArgs>) => {
      //     await ingestCommand({
      //       inputFile: argv["input-file"],
      //       dataDir: argv["data-dir"],
      //     });
      //   },
      // )
      .command(
        "ingest-ensrainbow",
        "Ingest labels from protobuf file into LevelDB",
        (yargs: Argv) => {
          return yargs
            .option("input-file", {
              type: "string",
              description: "Path to the protobuf file",
              default: join(process.cwd(), "rainbow-records.pb"),
            })
            .option("data-dir", {
              type: "string",
              description: "Directory to store LevelDB data",
              default: getDefaultDataSubDir(),
            });
        },
        async (argv: ArgumentsCamelCase<IngestProtobufArgs>) => {
          await ingestProtobufCommand({
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
              default: getDefaultDataSubDir(),
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
          return yargs
            .option("data-dir", {
              type: "string",
              description: "Directory containing LevelDB data",
              default: getDefaultDataSubDir(),
            })
            .option("lite", {
              type: "boolean",
              description:
                "Perform a faster, less thorough validation by skipping hash verification and record count validation",
              default: false,
            });
        },
        async (argv: ArgumentsCamelCase<ValidateArgs>) => {
          await validateCommand({
            dataDir: argv["data-dir"],
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
            description: "Directory containing LevelDB data",
            default: getDefaultDataSubDir(),
          });
        },
        async (argv: ArgumentsCamelCase<PurgeArgs>) => {
          await purgeCommand({
            dataDir: argv["data-dir"],
          });
        },
      )
      .command(
        "convert",
        "Convert rainbow tables from CSV format to ensrainbow format",
        (yargs: Argv) => {
          return yargs
            .option("input-file", {
              type: "string",
              description: "Path to the CSV input file",
              demandOption: true,
            })
            .option("label-set-id", {
              type: "string",
              description: "Label set id for the generated ensrainbow file",
              demandOption: true,
            })
            .coerce("label-set-id", buildLabelSetId)
            .option("output-file", {
              type: "string",
              description:
                "Path to where the resulting ensrainbow file will be output (if not provided, will be generated automatically)",
            })
            .option("progress-interval", {
              type: "number",
              description: "Number of records to process before logging progress",
              default: 50000,
            })
            .option("existing-db-path", {
              type: "string",
              description:
                "Path to existing ENSRainbow database to filter out existing labels and determine the next label set version (if not provided, version will be 0)",
            })
            .option("silent", {
              type: "boolean",
              description: "Disable progress bar (useful for scripts)",
              default: false,
            });
        },
        async (argv: ArgumentsCamelCase<ConvertCsvArgs>) => {
          await convertCsvCommand({
            inputFile: argv["input-file"],
            outputFile: argv["output-file"],
            labelSetId: argv["label-set-id"],
            progressInterval: argv["progress-interval"],
            existingDbPath: argv["existing-db-path"],
            silent: argv["silent"],
          });
        },
      )
      .command(
        "convert-sql",
        "Convert rainbow tables from legacy SQL dump to ensrainbow format",
        (yargs: Argv) => {
          return yargs
            .option("input-file", {
              type: "string",
              description: "Path to the gzipped SQL dump file",
              default: join(process.cwd(), "ens_names.sql.gz"),
            })
            .option("label-set-id", {
              type: "string",
              description: "Label set id for the generated ensrainbow file",
              demandOption: true,
            })
            .coerce("label-set-id", buildLabelSetId)
            .option("output-file", {
              type: "string",
              description: "Path to where the resulting ensrainbow file will be output",
            });
        },
        async (argv: ArgumentsCamelCase<ConvertArgs>) => {
          const outputFile =
            argv["output-file"] ?? join(process.cwd(), `${argv["label-set-id"]}_0.ensrainbow`);
          await convertCommand({
            inputFile: argv["input-file"],
            outputFile,
            labelSetId: argv["label-set-id"],
            labelSetVersion: 0,
          });
        },
      )
      .demandCommand(1, "You must specify a command")
      .fail((msg, err, yargs) => {
        if (process.env.VITEST) {
          // the test functions expect the default behavior of cli.parse to throw
          if (err) throw err;
          if (msg) throw new Error(msg);
        } else {
          // but we want to override yargs' default printing to stdout/stderr with console printing,
          // such that it can be silenced with vitest --silent
          yargs.showHelp();

          if (msg) console.error(msg);
          if (err) console.error(err);
        }
      })
      .strict()
      .help()
  );
}

// Only execute if this is the main module
const isMainModule = resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  createCLI().parse(hideBin(process.argv));
}
