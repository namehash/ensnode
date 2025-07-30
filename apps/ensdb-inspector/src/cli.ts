import { resolve } from "path";
import { fileURLToPath } from "url";
import type { ArgumentsCamelCase, Argv } from "yargs";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

import { dbInfoCommand } from "@/commands/db-info-command";
import { listSchemasCommand } from "@/commands/list-schemas-command";
import { schemaInfoCommand } from "@/commands/schema-info-command";

export interface CLIOptions {
  exitProcess?: boolean;
}

interface ListSchemasArgs {
  "database-url": string;
}

interface SchemaInfoArgs {
  "database-url": string;
  schema: string;
}

interface DbInfoArgs {
  "database-url": string;
}

export function createCLI(options: CLIOptions = {}) {
  const { exitProcess = true } = options;

  return yargs()
    .scriptName("ensdb-inspector")
    .exitProcess(exitProcess)
    .command(
      "list-schemas",
      "List all database schemas and categorize them",
      (yargs: Argv) => {
        return yargs.option("database-url", {
          type: "string",
          description: "PostgreSQL connection string",
          demandOption: true,
        });
      },
      async (argv: ArgumentsCamelCase<ListSchemasArgs>) => {
        await listSchemasCommand({
          databaseUrl: argv["database-url"],
        });
      },
    )
    .command(
      "schema-info <schema>",
      "Get detailed information about a specific schema",
      (yargs: Argv) => {
        return yargs
          .positional("schema", {
            type: "string",
            description: "Schema name to inspect",
            demandOption: true,
          })
          .option("database-url", {
            type: "string",
            description: "PostgreSQL connection string",
            demandOption: true,
          });
      },
      async (argv: ArgumentsCamelCase<SchemaInfoArgs>) => {
        await schemaInfoCommand({
          databaseUrl: argv["database-url"],
          schemaName: argv.schema,
        });
      },
    )
    .command(
      "db-info",
      "Get overall database information and statistics",
      (yargs: Argv) => {
        return yargs.option("database-url", {
          type: "string",
          description: "PostgreSQL connection string",
          demandOption: true,
        });
      },
      async (argv: ArgumentsCamelCase<DbInfoArgs>) => {
        await dbInfoCommand({
          databaseUrl: argv["database-url"],
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
