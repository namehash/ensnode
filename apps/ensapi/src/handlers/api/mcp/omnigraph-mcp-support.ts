import {
  getGraphqlApiExampleQueryById,
  listGraphqlApiExampleQueryIds,
  resolveGraphqlApiExampleQuery,
} from "@ensnode/ensnode-sdk/internal";

import di from "@/di";

/** MCP resource URI for a given example query id. */
export function omnigraphExampleUri(exampleId: string): string {
  return `omnigraph://examples/${exampleId}`;
}

const VALIDATION_HINTS: Array<{ match: RegExp; hint: string }> = [
  {
    match: /Unknown argument "id" on field "Query\.account"/,
    hint: "Use account(by: { address: $address }) — not account(id: ...).",
  },
  {
    match: /Cannot query field "primaryName" on type "Account"/,
    hint: "Primary names live under account.resolve.primaryName(by: { chainName: ETHEREUM }).",
  },
  {
    match: /Cannot query field "items"/,
    hint: "Relay connections use edges { node }, pageInfo, and totalCount — not items.",
  },
  {
    match: /Field "account" argument "by" .* is required/,
    hint: "Pass account(by: { address: $address }) or account(by: { id: $address }).",
  },
  {
    match: /Cannot query field "[^"]+" on type "ProfileSocials"/,
    hint:
      "ProfileSocials fields: github, keybase, linkedin, telegram, twitter only. " +
      "Call omnigraph_schema({ type: 'ProfileSocials' }) or use exampleId domain-profile.",
  },
];

function getMcpNamespace() {
  try {
    return di.context.namespace;
  } catch {
    return undefined;
  }
}

export function listOmnigraphExampleIds(): string[] {
  return listGraphqlApiExampleQueryIds();
}

export function buildOmnigraphExamplesIndex(): string {
  return JSON.stringify(
    {
      examples: listGraphqlApiExampleQueryIds().map((id) => {
        const { title, description } = getGraphqlApiExampleQueryById(id);
        return { id, uri: omnigraphExampleUri(id), title, description };
      }),
    },
    null,
    2,
  );
}

export function resolveOmnigraphExample(
  exampleId: string,
  variablesOverride?: Record<string, unknown>,
): { query: string; variables: Record<string, unknown> } {
  return resolveGraphqlApiExampleQuery(exampleId, {
    namespace: getMcpNamespace(),
    variables: variablesOverride,
  });
}

function appendValidationHints(responseText: string): string {
  let parsed: { data?: unknown; errors?: Array<{ message: string }> };
  try {
    parsed = JSON.parse(responseText) as { data?: unknown; errors?: Array<{ message: string }> };
  } catch {
    return responseText;
  }

  if (!parsed.errors?.length) return responseText;

  const hints = [
    ...new Set(
      parsed.errors.flatMap((error) =>
        VALIDATION_HINTS.filter(({ match }) => match.test(error.message)).map(({ hint }) => hint),
      ),
    ),
  ];
  if (hints.length === 0) return responseText;

  return JSON.stringify({ ...parsed, hints }, null, 2);
}

/** Executes a read-only Omnigraph query against the in-process Yoga instance. */
export async function executeOmnigraphQuery(
  query: string,
  variables?: Record<string, unknown>,
): Promise<string> {
  const { yoga } = await import("@/omnigraph-api/yoga");
  const response = await yoga.fetch(
    new Request("http://ensapi.internal/api/omnigraph", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables: variables ?? null }),
    }),
    { canAccelerate: false },
  );
  return appendValidationHints(await response.text());
}

export const OMNIGRAPH_MCP_INSTRUCTIONS = [
  "ENS Omnigraph MCP — read-only GraphQL over indexed ENSv1 + ENSv2 state.",
  "",
  "Before writing custom GraphQL:",
  "1. Read omnigraph://schema/condensed or call omnigraph_schema.",
  "2. Prefer omnigraph_query with exampleId (vetted queries) over guessing field names.",
  "3. Read omnigraph://examples/index for available exampleId values.",
  "",
  "Entry points:",
  "- account(by: { address }) — address-owned domains, permissions, reverse resolution",
  "- domain(by: { name }) — a single name",
  "- domains(where: { … }, first: N) — search canonical domains",
  "",
  "Common patterns:",
  "- Address overview (primary name + profile + ENSv1/v2 counts): exampleId account-profile",
  "- Primary name: account.resolve.primaryName(by: { chainName: ETHEREUM })",
  "- Profile: domain.resolve.profile or primaryName.resolve.profile",
  "- ENSv1 vs ENSv2 counts: exampleId account-migrated-names",
  "- Pagination: edges { node }, pageInfo { hasNextPage endCursor }, totalCount",
  "- Social fields: only ProfileSocials schema fields — do not guess (no discord/instagram)",
  "",
  "Anti-patterns (will fail validation):",
  "- account(id: …), Account.primaryName, connection.items",
  "",
  "Interactive schema browser: /api/omnigraph (GraphiQL).",
].join("\n");
