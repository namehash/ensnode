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
    "-Fc",
    "-Z3",
    "--no-owner",
    "--no-privileges",
    "-n",
    quoteIdent(schema),
    "-d",
    url,
    "-f",
    outFile,
  ];
}

/** `pg_restore` args for a custom-format dump. */
export function pgRestoreArgs(url: string, dumpFile: string): string[] {
  return ["--no-owner", "--no-privileges", "-d", url, dumpFile];
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
