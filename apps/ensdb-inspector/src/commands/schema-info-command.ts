import { closeDatabaseConnection, createDatabaseConnection, getSchemaInfo } from "@/lib/database";
import { sql } from "drizzle-orm";

export interface SchemaInfoCommandOptions {
  databaseUrl: string;
  schemaName: string;
}

export async function schemaInfoCommand(options: SchemaInfoCommandOptions): Promise<void> {
  let connection;

  try {
    console.log("🔍 Connecting to database...");
    connection = await createDatabaseConnection(options.databaseUrl);

    console.log(`📊 Analyzing schema: ${options.schemaName}\n`);

    // Get basic schema info
    const schemaInfo = await getSchemaInfo(connection.db, options.schemaName);

    // Display schema type with appropriate emoji
    const typeEmoji = {
      ponder_sync: "🔄",
      ensdb: "🏗️",
      unknown: "❓",
    }[schemaInfo.schemaType];

    console.log(`${typeEmoji} Schema Type: ${schemaInfo.schemaType}`);
    console.log(`📋 Table Count: ${schemaInfo.tableCount}`);

    if (schemaInfo.sizeBytes) {
      const sizeMB = (schemaInfo.sizeBytes / 1024 / 1024).toFixed(2);
      console.log(`💾 Total Size: ${sizeMB} MB`);
    }

    // Get table details
    console.log(`\n📑 Tables in ${options.schemaName}:`);

    const tables = await connection.db.execute(sql`
      SELECT 
        t.table_name,
        pg_total_relation_size(quote_ident(t.table_schema)||'.'||quote_ident(t.table_name)) as size_bytes,
        s.n_tup_ins as inserts,
        s.n_tup_upd as updates,
        s.n_tup_del as deletes,
        s.n_live_tup as live_tuples,
        s.last_vacuum,
        s.last_analyze
      FROM information_schema.tables t
      LEFT JOIN pg_stat_user_tables s ON (
        s.schemaname = t.table_schema AND s.relname = t.table_name
      )
      WHERE t.table_schema = ${options.schemaName}
      AND t.table_type = 'BASE TABLE'
      ORDER BY size_bytes DESC NULLS LAST, t.table_name
    `);

    // Display last modified time with proper handling for empty schemas
    if (schemaInfo.lastModified) {
      console.log(`⏰ Last Modified: ${schemaInfo.lastModified.toISOString()}`);
    } else {
      // Check if schema has any data - if not, it's likely inactive
      const hasData = tables.some((table) => Number(table.live_tuples || 0) > 0);
      if (!hasData && tables.length > 0) {
        console.log(`⏰ Last Modified: No recorded activity (empty schema)`);
      } else {
        console.log(`⏰ Last Modified: Unknown`);
      }
    }

    if (tables.length === 0) {
      console.log("  No tables found in this schema.");
    } else {
      tables.forEach((table) => {
        const sizeMB = table.size_bytes
          ? (Number(table.size_bytes) / 1024 / 1024).toFixed(2)
          : "N/A";
        const tuples = table.live_tuples ? Number(table.live_tuples).toLocaleString() : "N/A";
        console.log(`  • ${table.table_name}`);
        console.log(`    Size: ${sizeMB} MB, Rows: ${tuples}`);

        if (table.last_analyze) {
          console.log(`    Last analyzed: ${new Date(table.last_analyze).toISOString()}`);
        }
      });
    }

    // Additional info for ENSDb schemas
    if (schemaInfo.schemaType === "ensdb") {
      console.log(`\n🎯 ENS-specific Information:`);

      // Try to get domain count if domains table exists
      try {
        const domainCount = await connection.db.execute(sql`
          SELECT COUNT(*) as count 
          FROM ${sql.identifier(options.schemaName)}.${sql.identifier("domains")}
        `);
        console.log(`  • Total Domains: ${Number(domainCount[0]?.count || 0).toLocaleString()}`);
      } catch (error) {
        console.log(
          `  • Total Domains: Unable to determine (${error instanceof Error ? error.message : "Table might not exist"})`,
        );
      }

      // Try to get registration count
      try {
        const regCount = await connection.db.execute(sql`
          SELECT COUNT(*) as count 
          FROM ${sql.identifier(options.schemaName)}.${sql.identifier("registrations")}
        `);
        console.log(`  • Total Registrations: ${Number(regCount[0]?.count || 0).toLocaleString()}`);
      } catch (error) {
        console.log(
          `  • Total Registrations: Unable to determine (${error instanceof Error ? error.message : "Table might not exist"})`,
        );
      }

      // Get the latest domain creation if possible
      try {
        const latest = await connection.db.execute(sql`
          SELECT created_at, name
          FROM ${sql.identifier(options.schemaName)}.${sql.identifier("domains")}
          WHERE created_at IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 1
        `);

        if (latest[0]) {
          try {
            const dateValue = latest[0].created_at;
            let parsedDate: Date;

            // Handle Unix timestamp (number) vs date string
            if (typeof dateValue === "number" || !isNaN(Number(dateValue))) {
              // Unix timestamp - convert to milliseconds
              parsedDate = new Date(Number(dateValue) * 1000);
            } else {
              // Regular date string
              parsedDate = new Date(dateValue);
            }

            if (!isNaN(parsedDate.getTime())) {
              console.log(
                `  • Latest Domain Created: ${latest[0].name} (${parsedDate.toISOString()})`,
              );
            } else {
              console.log(
                `  • Latest Domain Created: ${latest[0].name} (date: ${dateValue} - invalid format)`,
              );
            }
          } catch (error) {
            console.log(
              `  • Latest Domain Created: ${latest[0].name} (date parsing error: ${latest[0].created_at})`,
            );
          }
        } else {
          console.log(`  • Latest Domain Created: No records found`);
        }
      } catch (error) {
        console.log(
          `  • Latest Domain Created: Unable to determine (${error instanceof Error ? error.message : "Column might not exist"})`,
        );
      }

      // Get the latest registration date if possible
      try {
        // First check what columns exist in the registrations table
        const regColumns = await connection.db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = ${options.schemaName} 
          AND table_name = 'registrations'
        `);

        const columnNames = regColumns.map((row) => row.column_name as string);

        // Try common registration date column names
        const dateColumns = ["registration_date", "created_at", "timestamp", "registered_at"];
        const dateColumn = dateColumns.find((col) => columnNames.includes(col));
        const nameColumn = columnNames.includes("name")
          ? "name"
          : columnNames.includes("label_name")
            ? "label_name"
            : columnNames.includes("domain")
              ? "domain"
              : columnNames.includes("label")
                ? "label"
                : null;

        if (dateColumn && nameColumn) {
          const latestReg = await connection.db.execute(sql`
            SELECT ${sql.identifier(dateColumn)} as reg_date, ${sql.identifier(nameColumn)} as name
            FROM ${sql.identifier(options.schemaName)}.${sql.identifier("registrations")}
            WHERE ${sql.identifier(dateColumn)} IS NOT NULL
            ORDER BY ${sql.identifier(dateColumn)} DESC
            LIMIT 1
          `);

          if (latestReg[0]) {
            try {
              const dateValue = latestReg[0].reg_date;
              let parsedDate: Date;

              // Handle Unix timestamp (number) vs date string
              if (typeof dateValue === "number" || !isNaN(Number(dateValue))) {
                // Unix timestamp - convert to milliseconds
                parsedDate = new Date(Number(dateValue) * 1000);
              } else {
                // Regular date string
                parsedDate = new Date(dateValue);
              }

              if (!isNaN(parsedDate.getTime())) {
                console.log(
                  `  • Latest Registration: ${latestReg[0].name} (${parsedDate.toISOString()})`,
                );
              } else {
                console.log(
                  `  • Latest Registration: ${latestReg[0].name} (date: ${dateValue} - invalid format)`,
                );
              }
            } catch (error) {
              console.log(
                `  • Latest Registration: ${latestReg[0].name} (date parsing error: ${latestReg[0].reg_date})`,
              );
            }
          } else {
            console.log(`  • Latest Registration: No records found`);
          }
        } else {
          console.log(`  • Registration date info: Available columns: ${columnNames.join(", ")}`);
        }
      } catch (error) {
        console.log(
          `  • Registration date: Unable to determine (${error instanceof Error ? error.message : "Unknown error"})`,
        );
      }
    }

    // Additional info for ponder_sync schema
    if (schemaInfo.schemaType === "ponder_sync") {
      console.log(`\n⚙️  Ponder Sync Information:`);

      try {
        const rpcCacheCount = await connection.db.execute(sql`
          SELECT COUNT(*) as count 
          FROM ${sql.identifier(options.schemaName)}.${sql.identifier("rpc_request_result")}
        `);
        console.log(
          `  • RPC Cache Entries: ${Number(rpcCacheCount[0]?.count || 0).toLocaleString()}`,
        );
      } catch {
        // Table might not exist
      }
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  } finally {
    if (connection) {
      await closeDatabaseConnection(connection);
    }
  }
}
