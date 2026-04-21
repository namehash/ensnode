-- This migration enables the pg_trgm extension, which is used for trigram-based indexing and
-- searching in PostgreSQL.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
