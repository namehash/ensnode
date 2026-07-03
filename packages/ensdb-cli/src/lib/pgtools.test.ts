import { describe, expect, it } from "vitest";

import { parseDumpSchemaName, pgDumpArgs, pgRestoreArgs, quoteIdent } from "./pgtools";

describe("quoteIdent", () => {
  it("double-quotes a dotted schema name", () => {
    expect(quoteIdent("alphaSchema1.16.0")).toBe('"alphaSchema1.16.0"');
  });

  it("escapes embedded double quotes", () => {
    expect(quoteIdent('we"ird')).toBe('"we""ird"');
  });
});

describe("pgDumpArgs", () => {
  it("dumps a single quoted schema in custom format, stripping owner/ACLs", () => {
    expect(pgDumpArgs("alphaSchema1.16.0", "postgresql://x/y", "/tmp/o.dump")).toEqual([
      "-Fc",
      "-Z3",
      "--no-owner",
      "--no-privileges",
      "-n",
      '"alphaSchema1.16.0"',
      "-d",
      "postgresql://x/y",
      "-f",
      "/tmp/o.dump",
    ]);
  });
});

describe("pgRestoreArgs", () => {
  it("restores a dump file, stripping owner/ACLs, in parallel", () => {
    expect(pgRestoreArgs("postgresql://x/y", "/tmp/o.dump")).toEqual([
      "--no-owner",
      "--no-privileges",
      "-j",
      "4",
      "-d",
      "postgresql://x/y",
      "/tmp/o.dump",
    ]);
  });

  it("honors ENSDB_CLI_RESTORE_JOBS", () => {
    const prev = process.env.ENSDB_CLI_RESTORE_JOBS;
    process.env.ENSDB_CLI_RESTORE_JOBS = "6";
    try {
      expect(pgRestoreArgs("postgresql://x/y", "/tmp/o.dump")).toContain("6");
    } finally {
      if (prev === undefined) delete process.env.ENSDB_CLI_RESTORE_JOBS;
      else process.env.ENSDB_CLI_RESTORE_JOBS = prev;
    }
  });
});

describe("parseDumpSchemaName", () => {
  it("extracts the schema name from a pg_restore --list TOC", () => {
    const toc = [
      ";",
      "; Archive created at 2026-06-19 12:00:00 UTC",
      ";",
      "216; 2615 16388 SCHEMA - alphaSchema1.16.0 postgres",
      "217; 1259 16500 TABLE alphaSchema1.16.0 domains postgres",
    ].join("\n");
    expect(parseDumpSchemaName(toc)).toBe("alphaSchema1.16.0");
  });

  it("returns undefined when no SCHEMA entry is present", () => {
    expect(parseDumpSchemaName("; nothing here\n")).toBeUndefined();
  });
});
