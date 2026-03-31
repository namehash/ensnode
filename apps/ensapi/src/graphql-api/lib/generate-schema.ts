import config from "@/config";

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { lexicographicSortSchema, printSchema } from "graphql";

import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";

import { makeLogger } from "@/lib/logger";

const logger = makeLogger("generate-schema");

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../../../../");
const ENSSDK_ROOT = resolve(MONOREPO_ROOT, "packages/enssdk/");
const OUTPUT_PATH = resolve(ENSSDK_ROOT, "src/omnigraph/generated/schema.graphql");

async function writeSchema() {
  const { schema } = await import("@/graphql-api/schema");
  const schemaAsString = printSchema(lexicographicSortSchema(schema));

  await writeFile(OUTPUT_PATH, schemaAsString);
  logger.info(`Wrote SDL to ${OUTPUT_PATH}`);
}

export async function writeGeneratedSchema() {
  const ENSv2Root = maybeGetDatasource(config.namespace, DatasourceNames.ENSv2Root);
  if (!ENSv2Root) return;

  try {
    await writeSchema();
  } catch (error) {
    logger.error(error, `Unable to write SDL to ${OUTPUT_PATH}`);
  }
}

// when executed directly: generate schema without requiring ensapi config
if (import.meta.url === `file://${process.argv[1]}`) {
  await writeSchema();
}
