import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { lexicographicSortSchema, printSchema } from "graphql";

import { makeLogger } from "@/lib/logger";

const logger = makeLogger("write-graphql-schema");

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../../../../");
const ENSSDK_ROOT = resolve(MONOREPO_ROOT, "packages/enssdk/");
const GENERATED_DIR = resolve(ENSSDK_ROOT, "src/omnigraph/generated");

async function _writeGraphQLSchema() {
  const { schema: unsortedSchema } = await import("@/omnigraph-api/schema");
  const schema = lexicographicSortSchema(unsortedSchema);
  const sdl = printSchema(schema);

  await writeFile(resolve(GENERATED_DIR, "schema.graphql"), sdl);
}

/**
 * Attempts to write the GraphQL Schema, swallowing any errors.
 */
export async function writeGraphQLSchema() {
  try {
    await _writeGraphQLSchema();
    logger.info(`Wrote SDL to ${GENERATED_DIR}`);
  } catch (error) {
    logger.warn(error, `Unable to write SDL to ${GENERATED_DIR}`);
  }
}

// when executed directly (`pnpm generate:gqlschema`), write generated schema and produce an exit code
if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await _writeGraphQLSchema();
    console.log(`Wrote SDL to ${GENERATED_DIR}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
