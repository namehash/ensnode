import { writeFileSync } from "node:fs";

import { defineCommand } from "citty";

import { dumpMetadata } from "../lib/ensdb";
import { dumpSchema } from "../lib/pgtools";

export const dump = defineCommand({
  meta: {
    name: "dump",
    description: "Dump an ENSIndexer schema (custom-format) and, optionally, its ENSNode metadata.",
  },
  args: {
    schema: {
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
      description: "Output .dump file path",
    },
    "metadata-out": {
      type: "string",
      description: "Also write the schema's ensnode.metadata rows to this JSON file",
    },
  },
  async run({ args }) {
    const from = args.from ?? process.env.ENSDB_URL;
    if (!from) throw new Error("source URL required: pass --from or set ENSDB_URL");

    await dumpSchema(args.schema, from, args.out);

    let metadataCount: number | undefined;
    const metadataOut = args["metadata-out"];
    if (metadataOut) {
      const rows = await dumpMetadata(from, args.schema);
      writeFileSync(metadataOut, JSON.stringify(rows, null, 2));
      metadataCount = rows.length;
    }

    process.stdout.write(
      `${JSON.stringify({ schema: args.schema, out: args.out, metadataOut, metadataCount }, null, 2)}\n`,
    );
  },
});
