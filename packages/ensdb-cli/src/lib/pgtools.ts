import { run } from "./exec";

/**
 * Double-quote a Postgres identifier. ENSIndexer schema names routinely contain dots (e.g.
 * `alphaSchema1.16.0`), which `pg_dump -n` treats as a schema.table pattern unless quoted.
 */
export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** `pg_dump` args for a single-schema, custom-format, owner/ACL-stripped dump. */
export function pgDumpArgs(schema: string, url: string, outFile: string): string[] {
  return [
    // custom format: compressed, restorable with `pg_restore`, and carries a queryable
    // table-of-contents (which we read to recover the dump's schema name on load).
    "-Fc",
    // gzip level 3: meaningful size reduction without paying the CPU cost of max compression.
    "-Z3",
    // don't emit ALTER ... OWNER TO statements; the dump's original DB role rarely exists on the
    // target ENSDb, and we restore objects as the connecting role instead.
    "--no-owner",
    // don't emit GRANT/REVOKE statements; ACLs reference roles that need not exist on the target.
    "--no-privileges",
    // restrict the dump to a single schema (the ENSIndexer schema); `quoteIdent` below keeps dotted
    // names (e.g. alphaSchema1.16.0) from being parsed as a schema.table pattern.
    "-n",
    quoteIdent(schema),
    // source ENSDb connection string.
    "-d",
    url,
    // write the custom-format archive to this file.
    "-f",
    outFile,
  ];
}

/** `pg_restore` args for a custom-format dump. */
export function pgRestoreArgs(url: string, dumpFile: string): string[] {
  return [
    // skip ALTER ... OWNER TO; restore objects as the connecting role (matches the `--no-owner` dump).
    "--no-owner",
    // skip GRANT/REVOKE; the dump carries none (`--no-privileges` on dump) and the target's roles differ.
    "--no-privileges",
    // target ENSDb connection string.
    "-d",
    url,
    // the custom-format archive to restore (positional, last).
    dumpFile,
  ];
}

/**
 * Parse the schema name out of a `pg_restore --list` table-of-contents. A single-schema dump
 * contains exactly one `SCHEMA - <name> <owner>` entry; schema names are dotted identifiers without
 * spaces, so the name is the first token after `SCHEMA - `.
 */
export function parseDumpSchemaName(tocText: string): string | undefined {
  for (const line of tocText.split("\n")) {
    const match = line.match(/\bSCHEMA - (\S+)\s+\S+\s*$/);
    if (match) return match[1];
  }
  return undefined;
}

export async function dumpSchema(schema: string, url: string, outFile: string): Promise<void> {
  await run("pg_dump", pgDumpArgs(schema, url, outFile));
}

export async function restoreDump(url: string, dumpFile: string): Promise<void> {
  await run("pg_restore", pgRestoreArgs(url, dumpFile));
}

/** Read the schema name embedded in a custom-format dump via its table-of-contents. */
export async function readDumpSchemaName(dumpFile: string): Promise<string | undefined> {
  const { stdout } = await run("pg_restore", ["--list", dumpFile]);
  return parseDumpSchemaName(stdout);
}
