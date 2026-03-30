import config from "@/config";

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { lexicographicSortSchema, printSchema } from "graphql";

import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";

import { makeLogger } from "@/lib/logger";

const logger = makeLogger("generate-schema");

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../../../../");
const OUTPUT_PATH = resolve(
  MONOREPO_ROOT,
  "packages/enssdk/src/omnigraph/generated/schema.graphql",
);

export async function writeGeneratedSchema() {
  const ENSv2Root = maybeGetDatasource(config.namespace, DatasourceNames.ENSv2Root);
  if (!ENSv2Root) return;

  const { schema } = await import("@/graphql-api/schema");
  const schemaAsString = printSchema(lexicographicSortSchema(schema));

  try {
    await writeFile(OUTPUT_PATH, schemaAsString);
    logger.info(`Wrote SDL to ${OUTPUT_PATH}`);
  } catch (error) {
    logger.error(error, `Unable to write SDL to ${OUTPUT_PATH}`);
  }
}
