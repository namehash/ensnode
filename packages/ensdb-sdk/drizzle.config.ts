import { defineConfig } from "drizzle-kit";

const ensNodeSchemaPath = "./src/ensnode/index.ts";

export default defineConfig({
  casing: "snake_case",
  dialect: "postgresql",
  out: "migrations",
  schema: ensNodeSchemaPath,
});
