import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { lexicographicSortSchema, printSchema } from "graphql";

import { makeLogger } from "@/lib/logger";

const logger = makeLogger("generate-schema");

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../../../../");
const ENSSDK_ROOT = resolve(MONOREPO_ROOT, "packages/enssdk/");
const OUTPUT_PATH = resolve(ENSSDK_ROOT, "src/omnigraph/generated/schema.graphql");

export async function writeGeneratedSchema() {
  const { schema } = await import("@/graphql-api/schema");
  const schemaAsString = printSchema(lexicographicSortSchema(schema));

  try {
    await writeFile(OUTPUT_PATH, schemaAsString);
    logger.info(`Wrote SDL to ${OUTPUT_PATH}`);
  } catch (error) {
    logger.error(error, `Unable to write SDL to ${OUTPUT_PATH}`);
  }
}

// when executed directly, write generated schema and exit
if (import.meta.url === `file://${process.argv[1]}`) {
  await writeGeneratedSchema();
  process.exit(0);
}
