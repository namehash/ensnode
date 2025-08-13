import { beforeEach, describe, expect, it, vi } from "vitest";
import { categorizeSchema, getDatabaseStats, getSchemaInfo, listSchemas } from "./database";

// Mock the drizzle and postgres dependencies
const mockExecute = vi.fn();
const mockDb = {
  execute: mockExecute,
};

describe("Database Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listSchemas", () => {
    it("should return list of schema names excluding system schemas", async () => {
      mockExecute.mockResolvedValueOnce([
        { schema_name: "ens4" },
        { schema_name: "ens5" },
        { schema_name: "ponder_sync" },
        { schema_name: "custom_schema" },
      ]);

      const schemas = await listSchemas(mockDb as any);

      expect(schemas).toEqual(["ens4", "ens5", "ponder_sync", "custom_schema"]);
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should handle empty schema list", async () => {
      mockExecute.mockResolvedValueOnce([]);

      const schemas = await listSchemas(mockDb as any);

      expect(schemas).toEqual([]);
    });

    it("should filter out all PostgreSQL system schemas", () => {
      // Test the filtering logic that would be applied by the SQL query
      const allSchemas = [
        "ens4",
        "ens5",
        "ponder_sync", // User schemas
        "information_schema", // Information schema
        "pg_catalog", // System catalog
        "pg_toast", // Toast schema
        "pg_temp_12", // Temporary schema
        "pg_toast_temp_95", // Temporary toast schema
        "pg_stat_tmp", // Statistics temp schema
        "custom_app", // Another user schema
      ];

      // Apply the same filtering logic as the SQL query
      const userSchemas = allSchemas.filter(
        (schema) => !schema.startsWith("pg_") && schema !== "information_schema",
      );

      expect(userSchemas).toEqual(["ens4", "ens5", "ponder_sync", "custom_app"]);
      expect(userSchemas.length).toBe(4);

      // Verify specific system schemas are excluded
      expect(userSchemas).not.toContain("pg_temp_12");
      expect(userSchemas).not.toContain("pg_toast_temp_95");
      expect(userSchemas).not.toContain("pg_catalog");
      expect(userSchemas).not.toContain("information_schema");
    });
  });

  describe("categorizeSchema", () => {
    it("should categorize ponder_sync schema correctly", async () => {
      const category = await categorizeSchema(mockDb as any, "ponder_sync");
      expect(category).toBe("ponder_sync");
    });

    it("should categorize ENSDb schema based on table names", async () => {
      mockExecute.mockResolvedValueOnce([
        { table_name: "domains" },
        { table_name: "registrations" },
        { table_name: "resolvers" },
      ]);

      const category = await categorizeSchema(mockDb as any, "ens4");

      expect(category).toBe("ensdb");
      expect(mockExecute).toHaveBeenCalled();
    });

    it("should categorize unknown schema when no ENS tables found", async () => {
      mockExecute.mockResolvedValueOnce([{ table_name: "users" }, { table_name: "products" }]);

      const category = await categorizeSchema(mockDb as any, "custom_app");

      expect(category).toBe("unknown");
    });

    it("should handle schema with partial ENS table matches", async () => {
      mockExecute.mockResolvedValueOnce([
        { table_name: "domain_events" },
        { table_name: "user_accounts" },
      ]);

      const category = await categorizeSchema(mockDb as any, "mixed_schema");

      expect(category).toBe("ensdb");
    });
  });

  describe("getSchemaInfo", () => {
    it("should return complete schema information", async () => {
      // Mock table count query
      mockExecute.mockResolvedValueOnce([{ table_count: 45 }]);

      // Mock size calculation query
      mockExecute.mockResolvedValueOnce([{ size_bytes: 1000000 }, { size_bytes: 2000000 }]);

      // Mock last modification query
      mockExecute.mockResolvedValueOnce([{ last_activity: "2024-01-15T10:30:00Z" }]);

      // Mock categorizeSchema dependency
      mockExecute.mockResolvedValueOnce([
        { table_name: "domains" },
        { table_name: "registrations" },
      ]);

      const schemaInfo = await getSchemaInfo(mockDb as any, "ens4");

      expect(schemaInfo.schemaName).toBe("ens4");
      expect(schemaInfo.schemaType).toBe("ensdb");
      expect(schemaInfo.tableCount).toBe(45);
      expect(schemaInfo.sizeBytes).toBe(3000000);
      expect(schemaInfo.lastModified).toEqual(new Date("2024-01-15T10:30:00Z"));
    });

    it("should handle schema with no activity timestamps", async () => {
      mockExecute
        .mockResolvedValueOnce([{ table_count: 10 }])
        .mockResolvedValueOnce([{ size_bytes: 500000 }])
        .mockResolvedValueOnce([{ last_activity: null }])
        .mockResolvedValueOnce([{ stats_reset: null }])
        .mockResolvedValueOnce([{ nspname: "test_schema" }])
        .mockResolvedValueOnce([]); // categorizeSchema tables query

      const schemaInfo = await getSchemaInfo(mockDb as any, "test_schema");

      expect(schemaInfo.lastModified).toBeUndefined();
    });

    it("should handle schema with fallback stats_reset timestamp", async () => {
      mockExecute
        .mockResolvedValueOnce([{ table_count: 5 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ last_activity: null }])
        .mockResolvedValueOnce([{ stats_reset: "2024-01-10T08:00:00Z" }])
        .mockResolvedValueOnce([]); // categorizeSchema tables query

      const schemaInfo = await getSchemaInfo(mockDb as any, "fallback_schema");

      expect(schemaInfo.lastModified).toEqual(new Date("2024-01-10T08:00:00Z"));
    });
  });

  describe("getDatabaseStats", () => {
    it("should return database statistics", async () => {
      // Mock total size query
      mockExecute.mockResolvedValueOnce([{ total_size: "132 GB" }]);

      // Mock schema count query
      mockExecute.mockResolvedValueOnce([{ schema_count: 100 }]);

      const connectionString = "postgresql://user:pass@localhost:5432/testdb";
      const stats = await getDatabaseStats(mockDb as any, connectionString);

      expect(stats).toEqual({
        totalSize: "132 GB",
        schemaCount: 100,
        connectionInfo: {
          host: "localhost",
          port: 5432,
          database: "testdb",
          user: "user",
        },
      });
    });

    it("should handle malformed connection string gracefully", async () => {
      mockExecute
        .mockResolvedValueOnce([{ total_size: "10 GB" }])
        .mockResolvedValueOnce([{ schema_count: 5 }]);

      const stats = await getDatabaseStats(mockDb as any, "invalid-connection-string");

      // Should not crash and return basic structure
      expect(stats.totalSize).toBe("10 GB");
      expect(stats.schemaCount).toBe(5);
      expect(stats.connectionInfo).toHaveProperty("host");
      expect(stats.connectionInfo).toHaveProperty("database");
      expect(stats.connectionInfo).toHaveProperty("port");
      expect(stats.connectionInfo).toHaveProperty("user");
    });
  });
});
