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
  {
    match: /Field "startsWith" is not defined by type "DomainsNameFilter"/,
    hint:
      "Omnigraph filter inputs use snake_case: starts_with, not startsWith. " +
      "Call omnigraph_schema({ type: 'DomainsNameFilter' }).",
  },
  {
    match: /Cannot query field "startsWith"/,
    hint:
      "Omnigraph filter inputs use snake_case: starts_with, not startsWith. " +
      "Call omnigraph_schema({ type: 'DomainsNameFilter' }).",
  },
  {
    match:
      /Field "[^"]*[A-Z][^"]*" is not defined by type "(DomainsNameFilter|SubdomainsWhereInput)"/,
    hint:
      "Omnigraph filter inputs use snake_case field names (e.g. starts_with). " +
      "Call omnigraph_schema({ type: 'DomainsNameFilter' }) before custom where filters.",
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
  const namespace = getMcpNamespace();
  return JSON.stringify(
    {
      examples: listGraphqlApiExampleQueryIds().map((id) => {
        const { title, description } = getGraphqlApiExampleQueryById(id);
        const { variables: defaultVariables } = resolveGraphqlApiExampleQuery(id, { namespace });
        return {
          id,
          uri: omnigraphExampleUri(id),
          title,
          description,
          defaultVariables,
        };
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

/** Executes a read-only Omnigraph query via the /api/omnigraph handler (middleware + Yoga). */
export async function executeOmnigraphQuery(
  query: string,
  variables?: Record<string, unknown>,
): Promise<string> {
  const omnigraphApi = await import("@/handlers/api/omnigraph/omnigraph-api");
  const response = await omnigraphApi.default.fetch(
    new Request("http://ensapi.internal/api/omnigraph", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables: variables ?? null }),
    }),
  );
  return appendValidationHints(await response.text());
}

/** One-line catalog of vetted exampleId values for MCP server instructions. */
function buildInlinedExamplesCatalog(): string {
  return listGraphqlApiExampleQueryIds()
    .map((id) => {
      const { description } = getGraphqlApiExampleQueryById(id);
      return `- ${id} — ${description}`;
    })
    .join("\n");
}

/** MCP server instructions sent to clients at initialize (system prompt). */
export function buildOmnigraphMcpInstructions(): string {
  return [
    "ENS Omnigraph MCP — read-only GraphQL over indexed ENSv1 + ENSv2 state.",
    "",
    "Before ANY query: call omnigraph_query with exampleId from the list below. Only write custom GraphQL if no example fits.",
    "",
    "Vetted exampleId values:",
    buildInlinedExamplesCatalog(),
    "",
    "When no example fits, discover the schema before writing custom GraphQL:",
    "- Read omnigraph://schema/condensed or call omnigraph_schema.",
    "- Use omnigraph_schema({ type: 'DomainsNameFilter' }) before custom where filters.",
    "",
    "Entry points:",
    "- account(by: { address }) — address-owned domains, permissions, reverse resolution",
    "- domain(by: { name }) — a single name",
    "- domains(where: { … }, first: N) — search canonical domains",
    "",
    "Anti-patterns (will fail validation):",
    "- account(id: …), Account.primaryName, connection.items",
    "- Filter fields use snake_case: starts_with, not startsWith",
    "- ProfileSocials: github, keybase, linkedin, telegram, twitter only — do not guess (no discord/instagram)",
    "- Pagination: edges { node }, pageInfo { hasNextPage endCursor }, totalCount — not items",
    "",
    "Interactive schema browser: /api/omnigraph (GraphiQL).",
  ].join("\n");
}
