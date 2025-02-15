import { join } from "path";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { ingestCommand } from "./commands/ingest-command";
import { serverCommand } from "./commands/server-command";
import { validateCommand } from "./commands/validate-command";
import { getDataDir } from "./lib/database";

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
          default: 3223,
        })
        .option("data-dir", {
          type: "string",
          description: "Directory containing LevelDB data",
          default: getDataDir(),
        });
    },
    async (argv: ArgumentsCamelCase<ServeArgs>) => {
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
