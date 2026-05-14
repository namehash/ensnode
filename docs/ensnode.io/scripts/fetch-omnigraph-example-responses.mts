import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/omnigraph-api/example-queries";

import { OMNIGRAPH_EXAMPLES_META } from "../src/data/omnigraph-examples/meta.ts";
import { DOCS_OMNIGRAPH_NAMESPACE, ENSNODE_URL } from "../src/lib/playground/constants.ts";

function logStep(message: string, id?: string) {
  console.log(`[omnigraph-examples] ${message} ${id ? `for '${id}'` : ""}`);
}

function logError(message: string, id?: string) {
  console.error(`[omnigraph-examples] ERROR: ${message} ${id ? `for example '${id}'` : ""}`);
}

const allExampleIds = (Object.keys(OMNIGRAPH_EXAMPLES_META) as string[]).sort();

const outputPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/omnigraph-examples/responses.json",
);

// Optional filter: `pnpm omnigraph-examples:refresh-responses <id>,<id>`
const argIds =
  process.argv[2]
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

if (argIds.length > 0) {
  const unknown = argIds.filter((id) => !allExampleIds.includes(id));
  if (unknown.length > 0) {
    logError(`Unknown example ID(s): ${unknown.join(", ")}. Known: ${allExampleIds.join(", ")}`);
    process.exit(1);
  }
}

const exampleIds = argIds.length > 0 ? argIds : allExampleIds;

const base = ENSNODE_URL.replace(/\/+$/, "");
const url = `${base}/api/omnigraph`;

logStep(
  argIds.length > 0
    ? `Refreshing ${exampleIds.length} of ${allExampleIds.length} examples from ${url}: ${exampleIds.join(", ")}`
    : `Fetching all ${exampleIds.length} Omnigraph examples from ${url}`,
);

// When refreshing a subset, load the existing responses so unaffected entries are preserved.
const out: Record<string, unknown> =
  argIds.length > 0 && existsSync(outputPath)
    ? (JSON.parse(readFileSync(outputPath, "utf8")) as Record<string, unknown>)
    : {};

for (const id of exampleIds) {
  logStep("Getting example query", id);

  const example = getGraphqlApiExampleQueryById(id);
  const query = example.query.trim();
  const variables = getNamespaceSpecificValue(DOCS_OMNIGRAPH_NAMESPACE, example.variables);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const text = await response.text();
    logError(`HTTP ${response.status}. Body (first 800 chars):\n${text.slice(0, 800)}`, id);
    process.exit(1);
  }

  const body = await response.json();

  if (
    typeof body === "object" &&
    body !== null &&
    "errors" in body &&
    Array.isArray((body as { errors: unknown }).errors) &&
    (body as { errors: unknown[] }).errors.length > 0
  ) {
    logError(`GraphQL errors: ${JSON.stringify(body, null, 2)}`, id);
    process.exit(1);
  }

  out[id] = body;
  logStep("Success", id);
}

logStep(`Writing responses to ${outputPath}`);
writeFileSync(outputPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
logStep("Done.");
