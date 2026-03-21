import { isPgEnum } from "drizzle-orm/pg-core";
import { isTable } from "drizzle-orm/table";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as abstractEnsIndexerSchema from "../ensindexer-abstract";
import { buildEnsDbDrizzleClient, buildIndividualEnsDbSchemas } from "./drizzle";

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => "mock-drizzle-client"),
}));

// Re-import after mock to get the mocked version
const { drizzle } = await import("drizzle-orm/node-postgres");
const drizzleMock = vi.mocked(drizzle);

const ENSINDEXER_SCHEMA_NAME = "ensindexer_test";

const DrizzleSchemaSymbol = Symbol.for("drizzle:Schema");

function getSchemaName(obj: unknown): string | undefined {
  return (obj as any)[DrizzleSchemaSymbol];
}

function getCombinedSchema(schemaName: string) {
  drizzleMock.mockClear();
  const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(schemaName);
  buildEnsDbDrizzleClient("postgres://localhost/test", concreteEnsIndexerSchema);
  const callArgs = drizzleMock.mock.calls[0][0] as { schema: Record<string, unknown> };
  return callArgs.schema;
}

describe("buildIndividualEnsDbSchemas", () => {
  it("returns a concreteEnsIndexerSchema containing all ENSIndexer schema exports", () => {
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);

    expect(concreteEnsIndexerSchema.event).toBeDefined();
    expect(concreteEnsIndexerSchema.v1Domain).toBeDefined();
    expect(concreteEnsIndexerSchema.registration).toBeDefined();
    expect(concreteEnsIndexerSchema.registrationType).toBeDefined();
  });

  it("returns an ensNodeSchema containing metadata", () => {
    const { ensNodeSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);

    expect(ensNodeSchema.metadata).toBeDefined();
  });

  it("preserves table/enum classification across abstract → concrete", () => {
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      const concreteValue = concreteEnsIndexerSchema[key as keyof typeof concreteEnsIndexerSchema];

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
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      if (!isTable(abstractValue)) continue;
      const concreteValue = concreteEnsIndexerSchema[key as keyof typeof concreteEnsIndexerSchema];
      expect(isTable(concreteValue)).toBe(true);
      expect(getSchemaName(concreteValue)).toBe(ENSINDEXER_SCHEMA_NAME);
    }
  });

  it("sets the schema name on all ENSIndexer enums", () => {
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      if (!isPgEnum(abstractValue)) continue;
      const concreteValue = concreteEnsIndexerSchema[key as keyof typeof concreteEnsIndexerSchema];
      expect(isPgEnum(concreteValue)).toBe(true);
      expect((concreteValue as any).schema).toBe(ENSINDEXER_SCHEMA_NAME);
    }
  });

  it("skips relation objects (neither tables nor enums)", () => {
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);

    for (const [key, value] of Object.entries(concreteEnsIndexerSchema)) {
      if (key.endsWith("_relations") || key.endsWith("Relations")) {
        expect(isTable(value)).toBe(false);
        expect(isPgEnum(value)).toBe(false);
      }
    }
  });

  it("applies a different schema name to ENSIndexer objects", () => {
    const otherSchemaName = "ensindexer_other";
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(otherSchemaName);

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      if (!isTable(abstractValue)) continue;
      const concreteValue = concreteEnsIndexerSchema[key as keyof typeof concreteEnsIndexerSchema];
      expect(isTable(concreteValue)).toBe(true);
      expect(getSchemaName(concreteValue)).toBe(otherSchemaName);
    }
  });

  it("builds two concrete schemas with respective names, leaving abstract unaffected", () => {
    const schemaNameA = "ensindexer_alpha";
    const schemaNameB = "ensindexer_beta";

    const { concreteEnsIndexerSchema: concreteA } = buildIndividualEnsDbSchemas(schemaNameA);
    const { concreteEnsIndexerSchema: concreteB } = buildIndividualEnsDbSchemas(schemaNameB);

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
  });
});

describe("combined schema (via buildEnsDbDrizzleClient)", () => {
  it("contains all ENSNode schema exports (metadata)", () => {
    const schema = getCombinedSchema(ENSINDEXER_SCHEMA_NAME);

    expect(schema.metadata).toBeDefined();
  });

  it("does not mutate the schema name on ENSNode tables", () => {
    const schema = getCombinedSchema(ENSINDEXER_SCHEMA_NAME);

    expect(getSchemaName(schema.metadata)).toBe("ensnode");
  });

  it("contains all ENSIndexer schema exports", () => {
    const schema = getCombinedSchema(ENSINDEXER_SCHEMA_NAME);

    for (const [key, abstractValue] of Object.entries(abstractEnsIndexerSchema)) {
      const concreteValue = schema[key as keyof typeof schema];
      if (isTable(abstractValue)) {
        expect(isTable(concreteValue)).toBe(true);
      } else if (isPgEnum(abstractValue)) {
        expect(isPgEnum(concreteValue)).toBe(true);
      }
    }
  });

  it("ensures ensnode metadata schema is consistent across multiple concrete schemas", () => {
    const schemaA = getCombinedSchema("ensindexer_alpha");
    const schemaB = getCombinedSchema("ensindexer_beta");

    expect(getSchemaName(schemaA.metadata)).toBe("ensnode");
    expect(getSchemaName(schemaB.metadata)).toBe("ensnode");
  });
});

describe("concrete tables — prototype and Symbol preservation", () => {
  const IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
  const Columns = Symbol.for("drizzle:Columns");
  const TableName = Symbol.for("drizzle:Name");

  it("preserves the Table prototype on cloned tables", () => {
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);
    const abstractTable = abstractEnsIndexerSchema.v1Domain;
    const concreteTable = concreteEnsIndexerSchema.v1Domain;

    expect(Object.getPrototypeOf(concreteTable)).toBe(Object.getPrototypeOf(abstractTable));
  });

  it("preserves Symbol-keyed properties (IsDrizzleTable, Columns, TableName) on cloned tables", () => {
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);
    const abstractTable = abstractEnsIndexerSchema.v1Domain;
    const concreteTable = concreteEnsIndexerSchema.v1Domain;

    expect((concreteTable as any)[IsDrizzleTable]).toBe((abstractTable as any)[IsDrizzleTable]);
    expect((concreteTable as any)[Columns]).toBe((abstractTable as any)[Columns]);
    expect((concreteTable as any)[TableName]).toBe((abstractTable as any)[TableName]);
  });

  it("isTable() returns true for cloned concrete tables", () => {
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);

    expect(isTable(concreteEnsIndexerSchema.v1Domain)).toBe(true);
    expect(isTable(concreteEnsIndexerSchema.registration)).toBe(true);
    expect(isTable(concreteEnsIndexerSchema.event)).toBe(true);
  });
});

describe("buildEnsDbDrizzleClient", () => {
  beforeEach(() => {
    drizzleMock.mockClear();
  });

  it("calls drizzle with the correct connection config", () => {
    const connectionString = "postgres://user:pass@localhost:5432/ensdb";
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);

    buildEnsDbDrizzleClient(connectionString, concreteEnsIndexerSchema);

    expect(drizzle).toHaveBeenCalledWith({
      connection: connectionString,
      schema: expect.objectContaining({
        metadata: expect.anything(),
      }),
      casing: "snake_case",
      logger: undefined,
    });
  });

  it("passes the logger to drizzle when provided", () => {
    const connectionString = "postgres://user:pass@localhost:5432/ensdb";
    const { concreteEnsIndexerSchema } = buildIndividualEnsDbSchemas(ENSINDEXER_SCHEMA_NAME);
    const logger = { logQuery: vi.fn() };

    buildEnsDbDrizzleClient(connectionString, concreteEnsIndexerSchema, logger);

    expect(drizzle).toHaveBeenCalledWith(expect.objectContaining({ logger }));
  });
});
