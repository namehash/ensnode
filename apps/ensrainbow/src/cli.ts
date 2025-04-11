import { join } from "path";
import { resolve } from "path";
import { fileURLToPath } from "url";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

import { ingestCommand } from "@/commands/ingest-command";
import { purgeCommand } from "@/commands/purge-command";
import { serverCommand } from "@/commands/server-command";
import { validateCommand } from "@/commands/validate-command";
import { serializeCommand, deserializeCommand } from "@/commands/serialize-command";
import { getDefaultDataSubDir, getEnvPort } from "@/lib/env";
import { SerializationFormat } from "@/utils/serializers/serializer-factory";

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

interface SerializeArgs {
  "input-file": string;
  "output-file": string;
  format: string;
  limit: number;
}

interface DeserializeArgs {
  "input-file": string;
  format: string;
  limit: number;
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
            description: "Path to the gzipped SQL dump file",
            default: join(process.cwd(), "ens_names.sql.gz"),
          })
          .option("data-dir", {
            type: "string",
            description: "Directory to store LevelDB data",
            default: getDefaultDataSubDir(),
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
      "serialize",
      "Serialize ENS names from SQL dump into a binary format",
      (yargs: Argv) => {
        return yargs
          .option("input-file", {
            type: "string",
            description: "Path to the gzipped SQL dump file",
            default: join(process.cwd(), "ens_names.sql.gz"),
          })
          .option("output-file", {
            type: "string",
            description: "Path to the output file",
            demandOption: true,
          })
          .option("format", {
            type: "string",
            description: "Serialization format to use",
            choices: Object.values(SerializationFormat),
            default: SerializationFormat.MsgPack,
          })
          .option("limit", {
            type: "number",
            description: "Maximum number of records to process (0 for no limit)",
            default: 0,
          });
      },
      async (argv: ArgumentsCamelCase<SerializeArgs>) => {
        await serializeCommand({
          inputFile: argv["input-file"],
          outputFile: argv["output-file"],
          format: argv.format as SerializationFormat,
          limit: argv.limit > 0 ? argv.limit : undefined,
        });
      },
    )
    .command(
      "deserialize",
      "Deserialize ENS names from a binary format for validation",
      (yargs: Argv) => {
        return yargs
          .option("input-file", {
            type: "string",
            description: "Path to the serialized file",
            demandOption: true,
          })
          .option("format", {
            type: "string",
            description: "Serialization format to use",
            choices: Object.values(SerializationFormat),
            default: SerializationFormat.MsgPack,
          })
          .option("limit", {
            type: "number",
            description: "Maximum number of records to process (0 for no limit)",
            default: 0,
          });
      },
      async (argv: ArgumentsCamelCase<DeserializeArgs>) => {
        await deserializeCommand({
          inputFile: argv["input-file"],
          format: argv.format as SerializationFormat,
          limit: argv.limit > 0 ? argv.limit : undefined,
        });
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
