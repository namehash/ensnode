import { join } from "path";
import { resolve } from "path";
import { fileURLToPath } from "url";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

import { convertCommand } from "@/commands/convert-command";
// import { ingestCommand } from "@/commands/ingest-command";
import { ingestProtobufCommand } from "@/commands/ingest-protobuf-command";
import { purgeCommand } from "@/commands/purge-command";
import { serverCommand } from "@/commands/server-command";
import { validateCommand } from "@/commands/validate-command";
import { getDefaultDataSubDir, getEnvPort } from "@/lib/env";
import { buildLabelSetId, buildLabelSetVersion } from "@ensnode/ensrainbow-sdk";

export function validatePortConfiguration(cliPort: number): void {
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
  "output-file": string;
  "label-set-id": string;
  "label-set-version": number;
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
        "Convert rainbow tables from SQL dump to protobuf format",
        (yargs: Argv) => {
          return yargs
            .option("input-file", {
              type: "string",
              description: "Path to the gzipped SQL dump file",
              default: join(process.cwd(), "ens_names.sql.gz"),
            })
            .option("output-file", {
              type: "string",
              description: "Path to the output protobuf file",
              default: join(process.cwd(), "rainbow-records.ensrainbow"),
            })
            .option("label-set-id", {
              type: "string",
              description: "Label set id for the rainbow record collection",
              demandOption: true,
            })
            .coerce("label-set-id", buildLabelSetId)
            .option("label-set-version", {
              type: "number",
              description: "Label set version for the rainbow record collection",
              demandOption: true,
            })
            .coerce("label-set-version", buildLabelSetVersion);
        },
        async (argv: ArgumentsCamelCase<ConvertArgs>) => {
          await convertCommand({
            inputFile: argv["input-file"],
            outputFile: argv["output-file"],
            labelSetId: argv["label-set-id"],
            labelSetVersion: argv["label-set-version"],
          });
        },
      )
      .demandCommand(1, "You must specify a command")
      .strict()
      .help()
  );
}

// Only execute if this is the main module
const isMainModule = resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  createCLI().parse(hideBin(process.argv));
}
