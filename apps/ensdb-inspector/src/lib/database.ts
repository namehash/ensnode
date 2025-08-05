import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { parse as parseConnectionString } from "pg-connection-string";
import postgres from "postgres";

export interface DatabaseConnection {
  client: postgres.Sql;
  db: ReturnType<typeof drizzle>;
}

export interface SchemaInfo {
  schemaName: string;
  schemaType: "ponder_sync" | "ensdb" | "unknown";
  tableCount: number;
  sizeBytes?: number;
  lastModified?: Date;
}

export interface DatabaseStats {
  totalSize: string;
  schemaCount: number;
  connectionInfo: {
    host: string;
    port: number;
    database: string;
    user: string;
  };
}

/**
 * Create a database connection from a connection string
 */
export async function createDatabaseConnection(
  connectionString: string,
): Promise<DatabaseConnection> {
  try {
    const config = parseConnectionString(connectionString);

    if (!config.host || !config.port || !config.database) {
      throw new Error("Invalid connection string: missing required parameters");
    }

    const client = postgres(connectionString, {
      max: 1, // Single connection for CLI usage
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const db = drizzle(client);

    // Test the connection
    await db.execute(sql`SELECT 1`);

    return { client, db };
  } catch (error) {
    throw new Error(
      `Failed to connect to database: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Close a database connection
 */
export async function closeDatabaseConnection(connection: DatabaseConnection): Promise<void> {
  await connection.client.end();
}

/**
 * Get list of all schemas in the database
 */
export async function listSchemas(db: ReturnType<typeof drizzle>): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT LIKE 'pg_%' 
    AND schema_name != 'information_schema'
    ORDER BY schema_name
  `);

  return result.map((row) => row.schema_name as string);
}

/**
 * Categorize a schema based on its tables and structure
 */
export async function categorizeSchema(
  db: ReturnType<typeof drizzle>,
  schemaName: string,
): Promise<SchemaInfo["schemaType"]> {
  // Check for ponder_sync schema
  if (schemaName === "ponder_sync") {
    return "ponder_sync";
  }

  // Get tables in the schema
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = ${schemaName}
    AND table_type = 'BASE TABLE'
  `);

  const tableNames = tables.map((row) => row.table_name as string);

  // Check for ENSDb pattern - look for typical ENS tables
  const ensDbTables = [
    "domain",
    "domains",
    "registration",
    "registrations",
    "resolver",
    "resolvers",
    "account",
    "accounts",
  ];

  const hasEnsDbTables = ensDbTables.some((ensTable) =>
    tableNames.some((tableName) => tableName.toLowerCase().includes(ensTable.toLowerCase())),
  );

  if (hasEnsDbTables) {
    return "ensdb";
  }

  return "unknown";
}

/**
 * Get detailed information about a schema
 */
export async function getSchemaInfo(
  db: ReturnType<typeof drizzle>,
  schemaName: string,
): Promise<SchemaInfo> {
  // Get table count
  const tableCountResult = await db.execute(sql`
    SELECT COUNT(*) as table_count
    FROM information_schema.tables 
    WHERE table_schema = ${schemaName}
    AND table_type = 'BASE TABLE'
  `);

  const tableCount = Number(tableCountResult[0]?.table_count || 0);

  // Get schema size (approximate)
  const sizeResult = await db.execute(sql`
    SELECT 
      pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename)) as size_bytes
    FROM pg_tables 
    WHERE schemaname = ${schemaName}
  `);

  const sizeBytes = sizeResult.reduce((total, row) => total + Number(row.size_bytes || 0), 0);

  // Get last modification time (based on table activity, fallback to table stats)
  const lastModResult = await db.execute(sql`
    SELECT 
      GREATEST(
        MAX(last_vacuum),
        MAX(last_autovacuum), 
        MAX(last_analyze),
        MAX(last_autoanalyze)
      ) as last_activity
    FROM pg_stat_user_tables
    WHERE schemaname = ${schemaName}
  `);

  let lastModified: Date | undefined;

  if (lastModResult[0]?.last_activity) {
    lastModified = new Date(lastModResult[0].last_activity as string);
  } else {
    // Fallback: get the most recent stats_reset time (when stats were last reset/schema was active)
    try {
      const fallbackResult = await db.execute(sql`
        SELECT MAX(stats_reset) as stats_reset
        FROM pg_stat_user_tables
        WHERE schemaname = ${schemaName}
      `);

      if (fallbackResult[0]?.stats_reset) {
        lastModified = new Date(fallbackResult[0].stats_reset as string);
      } else {
        // Final fallback: check for any schema creation info from pg_namespace
        const namespaceResult = await db.execute(sql`
          SELECT 
            n.nspname,
            (SELECT setting FROM pg_settings WHERE name = 'log_statement_stats') as has_logs
          FROM pg_namespace n
          WHERE n.nspname = ${schemaName}
        `);

        // If we have the schema but no timestamps, it exists but has no recorded activity
        if (namespaceResult[0]) {
          // Leave undefined - schema exists but has no recorded activity
          lastModified = undefined;
        }
      }
    } catch {
      // If no stats available, leave undefined
      lastModified = undefined;
    }
  }

  const schemaType = await categorizeSchema(db, schemaName);

  return {
    schemaName,
    schemaType,
    tableCount,
    sizeBytes,
    lastModified,
  };
}

/**
 * Get overall database statistics
 */
export async function getDatabaseStats(
  db: ReturnType<typeof drizzle>,
  connectionString: string,
): Promise<DatabaseStats> {
  const config = parseConnectionString(connectionString);

  // Get total database size
  const sizeResult = await db.execute(sql`
    SELECT pg_size_pretty(pg_database_size(current_database())) as total_size
  `);

  // Get schema count
  const schemaCountResult = await db.execute(sql`
    SELECT COUNT(*) as schema_count
    FROM information_schema.schemata 
    WHERE schema_name NOT LIKE 'pg_%' 
    AND schema_name != 'information_schema'
  `);

  return {
    totalSize: (sizeResult[0]?.total_size as string) || "Unknown",
    schemaCount: Number(schemaCountResult[0]?.schema_count || 0),
    connectionInfo: {
      host: config.host || "Unknown",
      port: Number(config.port) || 5432,
      database: config.database || "Unknown",
      user: config.user || "Unknown",
    },
  };
}
