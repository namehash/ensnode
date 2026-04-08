-- This migration adds an event trigger to handle cleanup of orphaned records
-- in the `ensnode.metadata` table when an ENSIndexer Schema is dropped.
-- Note: Running this migration requires superuser privileges due to
-- the use of event triggers.

CREATE OR REPLACE FUNCTION "ensnode"."handle_schema_dropped"()
RETURNS event_trigger
AS $$
DECLARE
    obj RECORD;
BEGIN
    FOR obj IN
        SELECT *
        FROM pg_event_trigger_dropped_objects()
    LOOP
        IF obj.object_type = 'schema'
           AND obj.object_name <> 'ensnode'
           AND to_regclass('"ensnode"."metadata"') IS NOT NULL THEN

            DELETE FROM "ensnode"."metadata"
            WHERE "ens_indexer_schema_name" = obj.object_name;

        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


DO $$
BEGIN
    CREATE EVENT TRIGGER cleanup_ensnode_metadata_on_schema_drop
    ON sql_drop
    WHEN TAG IN ('DROP SCHEMA')
    EXECUTE FUNCTION "ensnode"."handle_schema_dropped"();

EXCEPTION
    WHEN insufficient_privilege THEN
        -- Event trigger creation requires superuser privileges.
        -- This is expected in managed PostgreSQL environments.
        RAISE NOTICE
            'Event trigger "cleanup_ensnode_metadata_on_schema_drop" could not be created due to insufficient privileges. This feature requires superuser access.';
END;
$$;
