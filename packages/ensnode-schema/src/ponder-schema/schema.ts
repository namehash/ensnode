import { pgSchema } from "drizzle-orm/pg-core";

export const PONDER_SCHEMA_NAME = "ponder_sync";

export const PONDER_SCHEMA = pgSchema(PONDER_SCHEMA_NAME);
