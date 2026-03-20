import { isPgEnum } from "drizzle-orm/pg-core";
import { isTable } from "drizzle-orm/table";
import { describe, expect, it, vi } from "vitest";

import * as abstractEnsIndexerSchema from "../ensindexer-abstract";
import { buildEnsDbDrizzleClient, buildEnsDbSchema, buildIndividualEnsDbSchemas } from "./drizzle";

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => "mock-drizzle-client"),
}));

// Re-import after mock to get the mocked version
const { drizzle } = await import("drizzle-orm/node-postgres");

const ENSINDEXER_SCHEMA_NAME = "ensindexer_test";

const DrizzleSchemaSymbol = Symbol.for("drizzle:Schema");

function getSchemaName(obj: unknown): string | undefined {
  return (obj as any)[DrizzleSchemaSymbol];
}

describe("buildEnsDbSchema", () => {
  it("returns an object containing all ENSNode schema exports", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    expect(schema.metadata).toBeDefined();
  });

  it("returns an object containing all ENSIndexer schema exports", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    expect(schema.event).toBeDefined();
    expect(schema.v1Domain).toBeDefined();
    expect(schema.registration).toBeDefined();
    expect(schema.registrationType).toBeDefined();
  });

  it("preserves table/enum classification across abstract → concrete", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      const concreteValue = schema[key as keyof typeof schema];

      if (isTable(abstractValue)) {
        expect(isTable(concreteValue)).toBe(true);
      } else {
        expect(isTable(concreteValue)).toBe(false);
      }

      if (isPgEnum(abstractValue)) {
        expect(isPgEnum(concreteValue)).toBe(true);
      } else {
        expect(isPgEnum(concreteValue)).toBe(false);
      }
    }
  });

  it("sets the schema name on all ENSIndexer tables", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      if (!isTable(abstractValue)) continue;
      const concreteValue = schema[key as keyof typeof schema];
      expect(isTable(concreteValue)).toBe(true);
      expect(getSchemaName(concreteValue)).toBe(ENSINDEXER_SCHEMA_NAME);
    }
  });

  it("does not mutate the schema name on ENSNode tables", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    expect(getSchemaName(schema.metadata)).toBe("ensnode");
  });

  it("sets the schema name on all ENSIndexer enums", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      if (!isPgEnum(abstractValue)) continue;
      const concreteValue = schema[key as keyof typeof schema];
      expect(isPgEnum(concreteValue)).toBe(true);
      expect((concreteValue as any).schema).toBe(ENSINDEXER_SCHEMA_NAME);
    }
  });

  it("skips relation objects (neither tables nor enums)", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    for (const [key, value] of Object.entries(schema)) {
      if (key.endsWith("_relations") || key.endsWith("Relations")) {
        expect(isTable(value)).toBe(false);
        expect(isPgEnum(value)).toBe(false);
      }
    }
  });

  it("applies a different schema name to ENSIndexer objects", () => {
    const otherSchemaName = "ensindexer_other";
    const schema = buildEnsDbSchema(buildIndividualEnsDbSchemas(otherSchemaName).ensIndexerSchema);

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      if (!isTable(abstractValue)) continue;
      const concreteValue = schema[key as keyof typeof schema];
      expect(isTable(concreteValue)).toBe(true);
      expect(getSchemaName(concreteValue)).toBe(otherSchemaName);
    }
  });

  it("builds two concrete schemas with respective names, leaving abstract unaffected", () => {
    const schemaNameA = "ensindexer_alpha";
    const schemaNameB = "ensindexer_beta";

    const concreteA = buildEnsDbSchema(buildIndividualEnsDbSchemas(schemaNameA).ensIndexerSchema);
    const concreteB = buildEnsDbSchema(buildIndividualEnsDbSchemas(schemaNameB).ensIndexerSchema);

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      const valueA = concreteA[key as keyof typeof concreteA];
      const valueB = concreteB[key as keyof typeof concreteB];

      if (isTable(abstractValue)) {
        expect(isTable(valueA)).toBe(true);
        expect(isTable(valueB)).toBe(true);
        expect(getSchemaName(valueA)).toBe(schemaNameA);
        expect(getSchemaName(valueB)).toBe(schemaNameB);
        expect(getSchemaName(abstractValue)).toBeUndefined();
      }

      if (isPgEnum(abstractValue)) {
        expect(isPgEnum(valueA)).toBe(true);
        expect(isPgEnum(valueB)).toBe(true);
        expect((valueA as any).schema).toBe(schemaNameA);
        expect((valueB as any).schema).toBe(schemaNameB);
        expect((abstractValue as any).schema).toBeUndefined();
      }
    }

    expect(getSchemaName(concreteA.metadata)).toBe("ensnode");
    expect(getSchemaName(concreteB.metadata)).toBe("ensnode");
  });
});

describe("buildEnsDbSchema — prototype and Symbol preservation", () => {
  const IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
  const Columns = Symbol.for("drizzle:Columns");
  const TableName = Symbol.for("drizzle:Name");

  it("preserves the Table prototype on cloned tables", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );
    const abstractTable = abstractEnsIndexerSchema.v1Domain;
    const concreteTable = schema.v1Domain;

    expect(Object.getPrototypeOf(concreteTable)).toBe(Object.getPrototypeOf(abstractTable));
  });

  it("preserves Symbol-keyed properties (IsDrizzleTable, Columns, TableName) on cloned tables", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );
    const abstractTable = abstractEnsIndexerSchema.v1Domain;
    const concreteTable = schema.v1Domain;

    expect((concreteTable as any)[IsDrizzleTable]).toBe((abstractTable as any)[IsDrizzleTable]);
    expect((concreteTable as any)[Columns]).toBe((abstractTable as any)[Columns]);
    expect((concreteTable as any)[TableName]).toBe((abstractTable as any)[TableName]);
  });

  it("isTable() returns true for cloned concrete tables", () => {
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    expect(isTable(schema.v1Domain)).toBe(true);
    expect(isTable(schema.registration)).toBe(true);
    expect(isTable(schema.event)).toBe(true);
  });
});

describe("buildEnsDbDrizzleClient", () => {
  it("calls drizzle with the correct connection config", () => {
    const connectionString = "postgres://user:pass@localhost:5432/ensdb";
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );

    buildEnsDbDrizzleClient(connectionString, schema);

    expect(drizzle).toHaveBeenCalledWith({
      connection: connectionString,
      schema,
      casing: "snake_case",
      logger: undefined,
    });
  });

  it("passes the logger to drizzle when provided", () => {
    const connectionString = "postgres://user:pass@localhost:5432/ensdb";
    const schema = buildEnsDbSchema(
      buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME).ensIndexerSchema,
    );
    const logger = { logQuery: vi.fn() };

    buildEnsDbDrizzleClient(connectionString, schema, logger);

    expect(drizzle).toHaveBeenCalledWith(expect.objectContaining({ logger }));
  });
});
