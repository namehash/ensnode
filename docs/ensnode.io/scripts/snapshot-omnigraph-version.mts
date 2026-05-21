import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSchema, parse, validate } from "graphql";

import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { GRAPHQL_API_EXAMPLE_QUERIES } from "@ensnode/ensnode-sdk/internal";

import { DOCS_OMNIGRAPH_NAMESPACE, ENSNODE_URL } from "../src/lib/playground/constants.ts";

// Freeze the CURRENT workspace SDK omnigraph bundle (examples + schema) into a version
// snapshot. Run this on the release commit of <version>, where the SDK's example set is
// — by construction — valid against that release's schema. Responses are filled separately
// (`pnpm omnigraph-examples:refresh-responses`) once the version is live in production.
//
// Usage: pnpm omnigraph:snapshot <version>   e.g. pnpm omnigraph:snapshot v1.14.0

const version = process.argv[2];
if (!version) {
  console.error("Usage: pnpm omnigraph:snapshot <version>");
  process.exit(1);
}
// Used as a directory name; reject anything that could escape the versions/ dir.
if (!/^[0-9A-Za-z._-]+$/.test(version) || version.includes("..")) {
  console.error(`Invalid version "${version}": use only letters, digits, '.', '_', '-'.`);
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const versionDir = join(here, `../src/data/omnigraph-examples/versions/${version}`);
const sdkSchemaPath = join(here, "../../../packages/enssdk/src/omnigraph/generated/schema.graphql");

if (existsSync(versionDir)) {
  console.error(
    `Snapshot already exists: ${versionDir}. Snapshots are immutable; delete it first to re-cut.`,
  );
  process.exit(1);
}

const sdl = readFileSync(sdkSchemaPath, "utf8");
const schema = buildSchema(sdl);

const sdkVersion = (
  JSON.parse(readFileSync(join(here, "../../../packages/ensnode-sdk/package.json"), "utf8")) as {
    version: string;
  }
).version;

const examples = (
  GRAPHQL_API_EXAMPLE_QUERIES as Array<{ id: string; query: string; variables: unknown }>
).map((ex) => ({
  id: ex.id,
  query: ex.query.trim(),
  variables: getNamespaceSpecificValue(DOCS_OMNIGRAPH_NAMESPACE, ex.variables as never),
}));

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

mkdirSync(versionDir, { recursive: true });
writeFileSync(join(versionDir, "schema.graphql"), sdl, "utf8");
writeFileSync(join(versionDir, "examples.json"), `${JSON.stringify(examples, null, 2)}\n`, "utf8");
writeFileSync(
  join(versionDir, "snapshot.json"),
  `${JSON.stringify({ version, commit, sdkVersion, schemaTag: version, endpoint: ENSNODE_URL, snapshottedAt: new Date().toISOString().slice(0, 10) }, null, 2)}\n`,
  "utf8",
);

console.log(`Snapshotted ${examples.length} examples + schema for ${version} (commit ${commit}).`);
console.log("Next:");
console.log(
  `  1. OMNIGRAPH_VERSION=${version} pnpm omnigraph-examples:refresh-responses  # once ${version} is live`,
);
console.log(
  `  2. set ACTIVE_OMNIGRAPH_VERSION = "${version}" in src/data/omnigraph-examples/active.ts`,
);
