import { writeFileSync } from "node:fs";

import { defineCommand } from "citty";

import {
  EnsDbReader,
  EnsNodeMetadataKeys,
  type SerializedEnsNodeMetadata,
} from "@ensnode/ensdb-sdk";

import { dumpSchema } from "../lib/pgtools";

/** Path of the metadata sidecar written alongside a `<file>.dump`. */
export function metadataSidecarPath(dumpFile: string): string {
  return `${dumpFile}.metadata.json`;
}

export const dump = defineCommand({
  meta: {
    name: "dump",
    description: "Dump an ENSIndexer schema (custom-format) and its ENSNode metadata.",
  },
  args: {
    ensIndexerSchemaName: {
      type: "positional",
      required: true,
      description: "ENSIndexer schema name to dump (e.g. alphaSchema1.16.0)",
    },
    from: {
      type: "string",
      description: "Source ENSDb connection URL (defaults to $ENSDB_URL)",
    },
    out: {
      type: "string",
      alias: "f",
      required: true,
      description: "Output .dump file path (metadata is written to <out>.metadata.json)",
    },
  },
  async run({ args }) {
    const from = args.from ?? process.env.ENSDB_URL;
    if (!from) throw new Error("source URL required: pass --from or set ENSDB_URL");

    const ensIndexerSchemaName = args.ensIndexerSchemaName;

    await dumpSchema(ensIndexerSchemaName, from, args.out);

    // ENSNode metadata is a single record per ENSIndexer schema (the IndexingMetadataContext key).
    // Always write it to a sidecar so `load` can restore it together with the schema.
    const reader = new EnsDbReader(from, ensIndexerSchemaName);
    let metadata: SerializedEnsNodeMetadata | undefined;
    try {
      if (await reader.schemaExists("ensnode")) {
        metadata = await reader.getEnsNodeMetadata({
          key: EnsNodeMetadataKeys.IndexingMetadataContext,
        });
      }
    } finally {
      await reader.destroy();
    }

    const sidecar = metadataSidecarPath(args.out);
    writeFileSync(sidecar, JSON.stringify(metadata ?? null, null, 2));

    process.stdout.write(
      `${JSON.stringify(
        {
          ensIndexerSchemaName,
          out: args.out,
          metadataOut: sidecar,
          hasMetadata: metadata !== undefined,
        },
        null,
        2,
      )}\n`,
    );
  },
});
