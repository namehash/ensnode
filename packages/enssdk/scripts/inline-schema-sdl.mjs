import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(SCRIPT_DIR, "../src/omnigraph/generated/schema.graphql");
const OUT_PATH = resolve(SCRIPT_DIR, "../src/omnigraph/generated/schema-sdl.ts");

const sdl = readFileSync(SCHEMA_PATH, "utf8");
const content = `/** Auto-generated from schema.graphql — run \`pnpm generate:gqlschema\` to refresh. */
export const omnigraphSchemaSdl = ${JSON.stringify(sdl)};
`;

writeFileSync(OUT_PATH, content);
