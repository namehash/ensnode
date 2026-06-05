import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSchema, parse, validate } from "graphql";

import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { GRAPHQL_API_EXAMPLE_QUERIES as EXAMPLE_QUERIES_FROM_SDK } from "@ensnode/ensnode-sdk/internal";

import { OMNIGRAPH_EXAMPLES_CONFIG } from "../src/data/omnigraph-examples/config.ts";
import type { SnapshotExample } from "../src/data/omnigraph-examples/types.ts";

// Freeze the CURRENT workspace SDK omnigraph bundle (examples + schema) into the single
// vendored snapshot the docs render. Run this on the release commit of <version>, where the
// SDK's example set is — by construction — valid against that release's schema. <version> is
// recorded in snapshot.json for provenance. Responses are filled separately
// (`pnpm omnigraph-examples:refresh-responses`) once the version is live in production.
// Overwrites the existing snapshot; new-version work happens on a separate branch.
//
// Usage: pnpm omnigraph:snapshot <version>   e.g. pnpm omnigraph:snapshot v1.16.0

const version = process.argv[2];
if (!version) {
  console.error("Usage: pnpm omnigraph:snapshot <version>");
  process.exit(1);
}
// Sanity-check the CLI argument; <version> is only written to snapshot.json, not used as a path.
if (!/^[0-9A-Za-z._-]+$/.test(version) || version.includes("..")) {
  console.error(`Invalid version "${version}": use only letters, digits, '.', '_', '-'.`);
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "../src/data/omnigraph-examples");
const sdkSchemaPath = join(here, "../../../packages/enssdk/src/omnigraph/generated/schema.graphql");

const sdl = readFileSync(sdkSchemaPath, "utf8");
const schema = buildSchema(sdl);

const sdkVersion = (
  JSON.parse(readFileSync(join(here, "../../../packages/ensnode-sdk/package.json"), "utf8")) as {
    version: string;
  }
).version;

const sdkExampleById = new Map(EXAMPLE_QUERIES_FROM_SDK.map((ex) => [ex.id, ex]));

const examples: SnapshotExample[] = OMNIGRAPH_EXAMPLES_CONFIG.flatMap((config) => {
  const ex = sdkExampleById.get(config.id);
  if (!ex) {
    console.warn(
      `[omnigraph:snapshot] Skipping config id "${config.id}" — not in SDK example queries`,
    );
    return [];
  }
  return [
    {
      id: config.id,
      query: ex.query.trim(),
      variables: getNamespaceSpecificValue(config.namespace, ex.variables),
    },
  ];
});

// Fail fast if any example is invalid against this version's schema.
const invalid = examples.flatMap((ex) => {
  const errors = validate(schema, parse(ex.query));
  return errors.length > 0 ? [`${ex.id}: ${errors.map((e) => e.message).join("; ")}`] : [];
});
if (invalid.length > 0) {
  console.error(`Examples invalid against the ${version} schema:\n  ${invalid.join("\n  ")}`);
  process.exit(1);
}

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
} catch {
  // not in a git checkout; leave "unknown"
}

writeFileSync(join(dataDir, "schema.graphql"), sdl, "utf8");
writeFileSync(join(dataDir, "examples.json"), `${JSON.stringify(examples, null, 2)}\n`, "utf8");
writeFileSync(
  join(dataDir, "snapshot.json"),
  `${JSON.stringify({ version, commit, sdkVersion, schemaTag: version, snapshottedAt: new Date().toISOString().slice(0, 10) }, null, 2)}\n`,
  "utf8",
);

console.log(`Snapshotted ${examples.length} examples + schema for ${version} (commit ${commit}).`);
console.log(
  `Next: pnpm omnigraph-examples:refresh-responses  # fetches per-example namespace endpoints`,
);
