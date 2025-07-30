import {
  closeDatabaseConnection,
  createDatabaseConnection,
  getSchemaInfo,
  listSchemas,
} from "@/lib/database";

export interface ListSchemasCommandOptions {
  databaseUrl: string;
}

export async function listSchemasCommand(options: ListSchemasCommandOptions): Promise<void> {
  let connection;

  try {
    console.log("🔍 Connecting to database...");
    connection = await createDatabaseConnection(options.databaseUrl);

    console.log("📋 Discovering schemas...");
    const schemas = await listSchemas(connection.db);

    if (schemas.length === 0) {
      console.log("No user schemas found in the database.");
      return;
    }

    console.log(`\n📊 Found ${schemas.length} schema(s):\n`);

    // Get detailed info for each schema
    const schemaInfos = await Promise.all(
      schemas.map((schema) => getSchemaInfo(connection.db, schema)),
    );

    // Group by type
    const byType = {
      ponder_sync: schemaInfos.filter((s) => s.schemaType === "ponder_sync"),
      ensdb: schemaInfos.filter((s) => s.schemaType === "ensdb"),
      unknown: schemaInfos.filter((s) => s.schemaType === "unknown"),
    };

    // Helper function to format last modified time
    const formatLastModified = (info: any) => {
      if (info.lastModified) {
        return ` - ${info.lastModified.toISOString().split("T")[0]}`;
      } else {
        // Check if it's an empty schema by looking at table count and size
        const isEmpty =
          info.tableCount > 0 && (!info.sizeBytes || info.sizeBytes < 1024 * 1024 * 10); // Less than 10MB suggests empty
        return isEmpty ? " - empty" : " - unknown";
      }
    };

    // Display results
    if (byType.ponder_sync.length > 0) {
      console.log("🔄 Ponder Sync Schemas:");
      byType.ponder_sync.forEach((info) => {
        const lastMod = formatLastModified(info);
        console.log(`  • ${info.schemaName} (${info.tableCount} tables${lastMod})`);
      });
      console.log();
    }

    if (byType.ensdb.length > 0) {
      console.log("🏗️  ENSDb Schemas:");
      byType.ensdb.forEach((info) => {
        const sizeStr = info.sizeBytes ? ` - ${(info.sizeBytes / 1024 / 1024).toFixed(1)}MB` : "";
        const lastMod = formatLastModified(info);
        console.log(`  • ${info.schemaName} (${info.tableCount} tables${sizeStr}${lastMod})`);
      });
      console.log();
    }

    if (byType.unknown.length > 0) {
      console.log("❓ Unknown Schemas:");
      byType.unknown.forEach((info) => {
        const lastMod = formatLastModified(info);
        console.log(`  • ${info.schemaName} (${info.tableCount} tables${lastMod})`);
      });
      console.log();
    }

    console.log(
      "💡 Use 'schema-info <schema-name>' to get detailed information about a specific schema.",
    );
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  } finally {
    if (connection) {
      await closeDatabaseConnection(connection);
    }
  }
}
