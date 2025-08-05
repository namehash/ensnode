import {
  closeDatabaseConnection,
  createDatabaseConnection,
  getDatabaseStats,
  getSchemaInfo,
  listSchemas,
} from "@/lib/database";
import { sql } from "drizzle-orm";

export interface DbInfoCommandOptions {
  databaseUrl: string;
}

export async function dbInfoCommand(options: DbInfoCommandOptions): Promise<void> {
  let connection;

  try {
    console.log("🔍 Connecting to database...");
    connection = await createDatabaseConnection(options.databaseUrl);

    console.log("📊 Gathering database information...\n");

    // Get overall database stats
    const dbStats = await getDatabaseStats(connection.db, options.databaseUrl);

    console.log("🗄️  Database Overview:");
    console.log(`  • Host: ${dbStats.connectionInfo.host}:${dbStats.connectionInfo.port}`);
    console.log(`  • Database: ${dbStats.connectionInfo.database}`);
    console.log(`  • User: ${dbStats.connectionInfo.user}`);
    console.log(`  • Total Size: ${dbStats.totalSize}`);
    console.log(`  • Schema Count: ${dbStats.schemaCount}`);

    // Get PostgreSQL version
    const versionResult = await connection.db.execute(sql`SELECT version()`);
    const version = (versionResult[0]?.version as string) || "Unknown";
    const shortVersion = version.split(" ")[1] || version;
    console.log(`  • PostgreSQL Version: ${shortVersion}`);

    // Get uptime
    const uptimeResult = await connection.db.execute(sql`
      SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime
    `);
    console.log(`  • Uptime: ${uptimeResult[0]?.uptime || "Unknown"}`);

    // Get connection info
    const connectionsResult = await connection.db.execute(sql`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE pid <> pg_backend_pid()
    `);

    const connStats = connectionsResult[0];
    if (connStats) {
      console.log(
        `  • Connections: ${connStats.total_connections} total (${connStats.active_connections} active, ${connStats.idle_connections} idle)`,
      );
    }

    // Schema breakdown
    console.log("\n📋 Schema Breakdown:");
    const schemas = await listSchemas(connection.db);

    if (schemas.length === 0) {
      console.log("  No user schemas found.");
    } else {
      const schemaInfos = await Promise.all(
        schemas.map((schema) => getSchemaInfo(connection.db, schema)),
      );

      // Group by type and show summary
      const byType = {
        ponder_sync: schemaInfos.filter((s) => s.schemaType === "ponder_sync"),
        ensdb: schemaInfos.filter((s) => s.schemaType === "ensdb"),
        unknown: schemaInfos.filter((s) => s.schemaType === "unknown"),
      };

      console.log(`  🔄 Ponder Sync: ${byType.ponder_sync.length} schema(s)`);
      console.log(`  🏗️  ENSDb: ${byType.ensdb.length} schema(s)`);
      console.log(`  ❓ Unknown: ${byType.unknown.length} schema(s)`);

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

      // Show largest schemas
      const sortedBySize = schemaInfos
        .filter((s) => s.sizeBytes && s.sizeBytes > 0)
        .sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0))
        .slice(0, 5);

      if (sortedBySize.length > 0) {
        console.log("\n📊 Largest Schemas:");
        sortedBySize.forEach((schema) => {
          const sizeMB = schema.sizeBytes ? (schema.sizeBytes / 1024 / 1024).toFixed(2) : "0";
          const typeEmoji = {
            ponder_sync: "🔄",
            ensdb: "🏗️",
            unknown: "❓",
          }[schema.schemaType];
          const lastMod = formatLastModified(schema);
          console.log(
            `  ${typeEmoji} ${schema.schemaName}: ${sizeMB} MB (${schema.tableCount} tables${lastMod})`,
          );
        });
      }

      // Show schemas by type with last modified times
      if (byType.ensdb.length > 0) {
        console.log("\n🏗️  ENSDb Schemas (with timestamps):");
        byType.ensdb
          .sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0))
          .slice(0, 10) // Show top 10
          .forEach((schema) => {
            const sizeMB = schema.sizeBytes ? (schema.sizeBytes / 1024 / 1024).toFixed(1) : "0";
            const lastMod = formatLastModified(schema);
            console.log(`  • ${schema.schemaName}: ${sizeMB} MB${lastMod}`);
          });

        if (byType.ensdb.length > 10) {
          console.log(`  ... and ${byType.ensdb.length - 10} more ENSDb schemas`);
        }
      }
    }

    // Database activity (if accessible)
    try {
      const activityResult = await connection.db.execute(sql`
        SELECT 
          sum(xact_commit) as total_commits,
          sum(xact_rollback) as total_rollbacks,
          sum(blks_read) as blocks_read,
          sum(blks_hit) as blocks_hit,
          sum(tup_returned) as tuples_returned,
          sum(tup_fetched) as tuples_fetched,
          sum(tup_inserted) as tuples_inserted,
          sum(tup_updated) as tuples_updated,
          sum(tup_deleted) as tuples_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `);

      const activity = activityResult[0];
      if (activity && activity.total_commits) {
        console.log("\n📈 Database Activity (since last stats reset):");
        console.log(
          `  • Transactions: ${Number(activity.total_commits).toLocaleString()} commits, ${Number(activity.total_rollbacks || 0).toLocaleString()} rollbacks`,
        );

        const hitRatio =
          activity.blocks_hit && activity.blocks_read
            ? (
                (Number(activity.blocks_hit) /
                  (Number(activity.blocks_hit) + Number(activity.blocks_read))) *
                100
              ).toFixed(2)
            : "N/A";
        console.log(`  • Cache Hit Ratio: ${hitRatio}%`);

        const totalTuples =
          Number(activity.tuples_inserted || 0) +
          Number(activity.tuples_updated || 0) +
          Number(activity.tuples_deleted || 0);
        if (totalTuples > 0) {
          console.log(
            `  • Data Changes: ${Number(activity.tuples_inserted || 0).toLocaleString()} inserts, ${Number(activity.tuples_updated || 0).toLocaleString()} updates, ${Number(activity.tuples_deleted || 0).toLocaleString()} deletes`,
          );
        }
      }
    } catch (error) {
      // Stats might not be accessible
      console.log("\n📈 Database Activity: Not accessible");
    }

    console.log(
      "\n💡 Use 'list-schemas' to see all schemas or 'schema-info <name>' for detailed schema information.",
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
