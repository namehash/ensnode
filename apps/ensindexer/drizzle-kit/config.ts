import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

// Resolve the path to the database schema file for Drizzle migrations.
const dbSchemaPath = fileURLToPath(new URL("./schema.ts", import.meta.url));

export default defineConfig({
  casing: "snake_case",
  dialect: "postgresql",
  out: `drizzle-kit/migrations`,
  schema: dbSchemaPath,
});
