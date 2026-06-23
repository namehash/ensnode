import { existsSync, readFileSync } from "node:fs";

import { defineCommand } from "citty";

import {
  EnsDbWriter,
  EnsNodeMetadataKeys,
  type SerializedEnsNodeMetadata,
} from "@ensnode/ensdb-sdk";

import { ensnodeMigrationsDir } from "../lib/migrations";
import { readDumpSchemaName, restoreDump } from "../lib/pgtools";
import { metadataSidecarPath } from "./dump";

export const load = defineCommand({
  meta: {
    name: "load",
    description:
      "Restore an ENSIndexer schema dump (and its ENSNode metadata) into a target ENSDb.",
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
      required: true,
      description: "Target ENSIndexer schema name (the dump is renamed to this on restore)",
    },
    force: {
      type: "boolean",
      default: false,
      description:
        "Overwrite an existing target schema and/or its ENSNode metadata entry (default: fail if either exists)",
    },
  },
  async run({ args }) {
    const ensIndexerSchemaName = args.schema;
    const force = args.force;

    // Greptile P1: the dump's own schema name must be reliably resolvable; never restore into the
    // wrong (or zero) schema by silently guessing.
    const dumpSchemaName = await readDumpSchemaName(args.dump);
    if (!dumpSchemaName) {
      throw new Error(
        `could not determine the dump's schema name from ${args.dump} (no SCHEMA entry in its table-of-contents); refusing to restore`,
      );
    }

    // Metadata sidecar is always written by `dump`; require it.
    const sidecar = metadataSidecarPath(args.dump);
    if (!existsSync(sidecar)) {
      throw new Error(
        `metadata sidecar not found at ${sidecar}; expected it alongside the dump (produced by \`ensdb-cli dump\`)`,
      );
    }
    const metadata = JSON.parse(readFileSync(sidecar, "utf-8")) as SerializedEnsNodeMetadata | null;

    const writer = new EnsDbWriter(args.into, ensIndexerSchemaName);
    try {
      // Migrate the ENSNode schema FIRST so the `ensnode` schema, its metadata table, and the
      // pg_trgm extension exist before pg_restore recreates the ENSIndexer schema's trigram indexes.
      await writer.migrateEnsNodeSchema(ensnodeMigrationsDir());

      // Fail-fast on conflicts unless --force.
      const targetSchemaExists = await writer.schemaExists(ensIndexerSchemaName);
      const existingMetadata = await writer.getEnsNodeMetadata({
        key: EnsNodeMetadataKeys.IndexingMetadataContext,
      });

      if (!force) {
        const conflicts: string[] = [];
        if (targetSchemaExists) conflicts.push(`schema "${ensIndexerSchemaName}"`);
        if (existingMetadata) {
          conflicts.push(`ENSNode metadata entry for "${ensIndexerSchemaName}"`);
        }
        if (conflicts.length > 0) {
          throw new Error(`${conflicts.join(" and ")} already exist(s); pass --force to overwrite`);
        }
      }

      // Make the restore idempotent: clear the dump's own schema name, restore, then rename to the
      // target (dropping any prior target). The Postgres schema name does not affect Ponder's
      // build_id, so renaming is safe for resume.
      await writer.dropSchema(dumpSchemaName);
      await restoreDump(args.into, args.dump);

      if (dumpSchemaName !== ensIndexerSchemaName) {
        await writer.dropSchema(ensIndexerSchemaName);
        await writer.renameSchema(dumpSchemaName, ensIndexerSchemaName);
      }

      // Upsert the metadata under the target schema (re-keyed by the writer).
      if (metadata) {
        await writer.writeEnsNodeMetadata(metadata);
      }

      process.stdout.write(
        `${JSON.stringify(
          {
            loaded: true,
            ensIndexerSchemaName,
            from: dumpSchemaName,
            hasMetadata: metadata !== null,
          },
          null,
          2,
        )}\n`,
      );
    } finally {
      await writer.destroy();
    }
  },
});
