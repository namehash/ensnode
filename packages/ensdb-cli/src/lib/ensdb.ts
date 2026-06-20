import { createRequire } from "node:module";
import { join } from "node:path";

import { eq, sql } from "drizzle-orm";

import { EnsDbReader, type EnsDbWriter } from "@ensnode/ensdb-sdk";

/** One ENSNode metadata record, keyed by `key` within an ENSIndexer schema's namespace. */
export interface MetadataRow {
  key: string;
  value: unknown;
}

// The ENSDb SDK ships the ENSNode Schema migrations alongside its build (`files: ["dist","migrations"]`);
// resolve the directory at runtime the same way ENSIndexer does.
function ensnodeMigrationsDir(): string {
  return join(createRequire(import.meta.url).resolve("@ensnode/ensdb-sdk"), "../../migrations");
}

// `EnsDbReader.ensDb` is a Drizzle node-postgres client; `.execute(sql)` returns a pg QueryResult.
type DrizzleClient = EnsDbReader["ensDb"];

export async function schemaExists(db: DrizzleClient, name: string): Promise<boolean> {
  const result = (await db.execute(
    sql`select 1 from information_schema.schemata where schema_name = ${name} limit 1`,
  )) as { rows?: unknown[] };
  return (result.rows?.length ?? 0) > 0;
}

export async function dropSchema(db: DrizzleClient, name: string): Promise<void> {
  await db.execute(sql`drop schema if exists ${sql.identifier(name)} cascade`);
}

export async function renameSchema(db: DrizzleClient, from: string, to: string): Promise<void> {
  await db.execute(sql`alter schema ${sql.identifier(from)} rename to ${sql.identifier(to)}`);
}

/** Read the ENSNode metadata rows belonging to `schema` from the source ENSDb. */
export async function dumpMetadata(srcUrl: string, schema: string): Promise<MetadataRow[]> {
  const reader = new EnsDbReader(srcUrl, schema);
  try {
    if (!(await schemaExists(reader.ensDb, "ensnode"))) return [];
    return await reader.ensDb
      .select({
        key: reader.ensNodeSchema.metadata.key,
        value: reader.ensNodeSchema.metadata.value,
      })
      .from(reader.ensNodeSchema.metadata)
      .where(eq(reader.ensNodeSchema.metadata.ensIndexerSchemaName, schema));
  } finally {
    await reader.destroy();
  }
}

/**
 * Ensure the shared `ensnode` schema exists, then upsert `rows` under `targetSchema`'s namespace.
 * Re-keys the records to `targetSchema` so a checkpoint loaded under a renamed schema keeps its
 * metadata.
 */
export async function loadMetadata(
  writer: EnsDbWriter,
  targetSchema: string,
  rows: MetadataRow[],
): Promise<void> {
  await writer.migrateEnsNodeSchema(ensnodeMigrationsDir());
  for (const row of rows) {
    await writer.ensDb
      .insert(writer.ensNodeSchema.metadata)
      .values({ ensIndexerSchemaName: targetSchema, key: row.key, value: row.value })
      .onConflictDoUpdate({
        target: [
          writer.ensNodeSchema.metadata.ensIndexerSchemaName,
          writer.ensNodeSchema.metadata.key,
        ],
        set: { value: row.value },
      });
  }
}
