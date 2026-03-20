/**
 * We re-export (just) the "abstract" ENSIndexer Schema from ENSDb for Ponder to manage.
 * Ponder will internally build a "concrete" ENSIndexer Schema using
 * the "abstract" ENSIndexer Schema and the ENSIndexer Schema name.
 **/
export * from "@ensnode/ensdb-sdk/ensindexer-abstract";
