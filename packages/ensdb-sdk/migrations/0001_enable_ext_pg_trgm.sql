-- Enable the pg_trgm extension in the 'ensnode' schema (created by migration 0000).
-- Installing into 'ensnode' rather than the default creation schema avoids a dependency
-- on 'public' existing, and lets the connection's search_path put this extension's
-- operators/opclasses (e.g. gin_trgm_ops) on the lookup path for trigram indexes.
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA "ensnode";
