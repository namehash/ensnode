import { readFileSync } from "node:fs";

import { defineCommand } from "citty";

import { EnsDbWriter } from "@ensnode/ensdb-sdk";

import {
  dropSchema,
  loadMetadata,
  type MetadataRow,
  renameSchema,
  schemaExists,
} from "../lib/ensdb";
import { readDumpSchemaName, restoreDump } from "../lib/pgtools";

export const load = defineCommand({
  meta: {
    name: "load",
    description: "Restore an ENSIndexer schema dump into a target ENSDb, optionally renaming it.",
  },
  args: {
    dump: {
      type: "positional",
      required: true,
      description: "Path to the .dump file produced by `ensdb-cli dump`",
    },
    into: {
      type: "string",
      required: true,
      description: "Target ENSDb connection URL",
    },
    schema: {
      type: "string",
      description: "Target schema name (renamed to this; defaults to the dump's own schema name)",
    },
    metadata: {
      type: "string",
      description:
        "ENSNode metadata JSON (from `dump --metadata-out`) to upsert under the target schema",
    },
    "skip-if-exists": {
      type: "boolean",
      default: false,
      description: "No-op if the target schema already exists (don't overwrite)",
    },
  },
  async run({ args }) {
    const dumpSchemaName = await readDumpSchemaName(args.dump);
    const targetSchema = args.schema ?? dumpSchemaName;
    if (!targetSchema) {
      throw new Error("could not determine target schema from the dump; pass --schema");
    }

    const writer = new EnsDbWriter(args.into, targetSchema);
    try {
      if (args["skip-if-exists"] && (await schemaExists(writer.ensDb, targetSchema))) {
        process.stdout.write(
          `${JSON.stringify({ skipped: true, reason: "schema exists", schema: targetSchema }, null, 2)}\n`,
        );
        return;
      }

      // Make the restore idempotent: clear the dump's own schema name, restore, then rename to the
      // target (replacing any prior target). The Postgres schema name does not affect Ponder's
      // build_id, so renaming is safe for resume.
      if (dumpSchemaName) await dropSchema(writer.ensDb, dumpSchemaName);
      await restoreDump(args.into, args.dump);

      if (dumpSchemaName && dumpSchemaName !== targetSchema) {
        await dropSchema(writer.ensDb, targetSchema);
        await renameSchema(writer.ensDb, dumpSchemaName, targetSchema);
      }

      let metadataCount: number | undefined;
      if (args.metadata) {
        const rows = JSON.parse(readFileSync(args.metadata, "utf-8")) as MetadataRow[];
        await loadMetadata(writer, targetSchema, rows);
        metadataCount = rows.length;
      }

      process.stdout.write(
        `${JSON.stringify({ loaded: true, schema: targetSchema, from: dumpSchemaName, metadataCount }, null, 2)}\n`,
      );
    } finally {
      await writer.destroy();
    }
  },
});
