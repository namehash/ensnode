import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle.schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "postgresql://dbuser:abcd1234@localhost:54320/ensnode_local_ponder_0_16",
  },
});
