import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/omnigraph-api/example-queries";

import { COOKBOOK_META } from "../src/data/omnigraph-examples/meta.ts";
import { DOCS_OMNIGRAPH_NAMESPACE, ENSNODE_URL } from "../src/lib/playground/constants.ts";

function logStep(message: string, id?: string) {
  console.log(`[cookbook-refresher] ${message} ${id ? `for '${id}'` : ""}`);
}

function logError(message: string, id?: string) {
  console.error(`[cookbook-refresher] ERROR: ${message} ${id ? `for example '${id}'` : ""}`);
}

const allCookbookIds = (Object.keys(COOKBOOK_META) as string[]).sort();

const outputPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/omnigraph-examples/responses.json",
);

// Optional filter: `pnpm cookbook:refresh-responses <id>,<id>`
const argIds =
  process.argv[2]
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

if (argIds.length > 0) {
  const unknown = argIds.filter((id) => !allCookbookIds.includes(id));
  if (unknown.length > 0) {
    logError(`Unknown cookbook ID(s): ${unknown.join(", ")}. Known: ${allCookbookIds.join(", ")}`);
    process.exit(1);
  }
}

const cookbookIds = argIds.length > 0 ? argIds : allCookbookIds;

const base = ENSNODE_URL.replace(/\/+$/, "");
const url = `${base}/api/omnigraph`;

logStep(
  argIds.length > 0
    ? `Refreshing ${cookbookIds.length} of ${allCookbookIds.length} examples from ${url}: ${cookbookIds.join(", ")}`
    : `Fetching all ${cookbookIds.length} cookbook examples from ${url}`,
);

// When refreshing a subset, load the existing responses so unaffected entries are preserved.
const out: Record<string, unknown> =
  argIds.length > 0 && existsSync(outputPath)
    ? (JSON.parse(readFileSync(outputPath, "utf8")) as Record<string, unknown>)
    : {};

for (const id of cookbookIds) {
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
