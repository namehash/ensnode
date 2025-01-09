import { type Context } from "ponder:registry";
const tableNames = ["accounts", "domains", "wrapped_domains", "registrations", "resolvers"];

// This file is not intended to be user-facing and is kept here as a devtool for iterating on
// logic in handlers far from the startBlock. It will be removed when ponder's historical cache
// query time is sped up (early Q1 2025) so that historical reindexing does not take nearly as long.

// imports the database dump into the tables
export async function loadCheckpoint(context: Context) {
  console.log(`👷 Loading checkpoint...`);

  // truncate all relevant tables
  await context.db.sql.execute(
    `TRUNCATE accounts, domains, registrations, resolvers, wrapped_domains CASCADE`,
  );

  // copy each table from checkpoint schema
  for (const tableName of tableNames) {
    console.log(`Copying ${tableName}...`);
    await context.db.sql.execute(`
      INSERT INTO public.${tableName}
      SELECT * FROM checkpoint.${tableName}
    `);
  }

  console.log(`🚧 Loaded checkpoint!`);
}
