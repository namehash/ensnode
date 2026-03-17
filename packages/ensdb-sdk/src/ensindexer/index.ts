/**
 * Merge the various sub-schemas into ENSIndexer Schema.
 */

// TODO: remove `ensnode-metadata.schema` export when database migrations
// for ENSNode Schema are executable.
export * from "./ensnode-metadata.schema";
export * from "./ensv2.schema";
export * from "./protocol-acceleration.schema";
export * from "./registrars.schema";
export * from "./subgraph.schema";
export * from "./tokenscope.schema";
