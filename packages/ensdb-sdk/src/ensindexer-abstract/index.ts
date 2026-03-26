/**
 * Merge the various sub-schemas into an "abstract" ENSIndexer Schema.
 * This "abstract" ENSIndexer Schema is used to build the "concrete" ENSIndexer Schema
 * for ENSDb, which is then used to build the ENSDb Schema for a Drizzle client for ENSDb.
 */

export * from "./ensv2.schema";
export * from "./protocol-acceleration.schema";
export * from "./registrars.schema";
export * from "./subgraph.schema";
export * from "./tokenscope.schema";
