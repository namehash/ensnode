/** Pretty-print JSON for Starlight `Code` blocks and ENSAdmin query params. */
export function stringifyJsonForDocs(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function getNiceHeightForCodeSnippet(snippet: string): number {
  const linesCount = snippet.split("\n").length;
  const lineHeight = 18;
  const headerHeight = 38;
  const footerHeight = 32;
  const height = linesCount * lineHeight + headerHeight + footerHeight;

  const terminalHeightPercentage = 0.35;

  return Math.ceil(height / (1 - terminalHeightPercentage));
}

/**
 * Build a curl example that POSTs the same JSON body as enssdk's Omnigraph module
 * (`POST {baseUrl}/api/omnigraph` with `{ query, variables }`).
 */
export function buildOmnigraphCurlExample(params: {
  connectionBaseUrl: string;
  query: string;
  variables: Record<string, unknown>;
}): string {
  const base = params.connectionBaseUrl.replace(/\/+$/, "");
  const url = `${base}/api/omnigraph`;
  const compactQuery = params.query.replace(/\s+/g, " ").trim();
  const body = JSON.stringify(
    {
      query: compactQuery,
      variables: params.variables,
    },
    null,
    2,
  );
  return [
    `# POST JSON to your ENSNode Omnigraph endpoint (same path enssdk uses).`,
    `curl -sS -X POST "${url}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d @- <<'EOF'`,
    body,
    `EOF`,
  ].join("\n");
}

/** Docs path for the hosted ENSNode instances catalog. */
export const HOSTED_INSTANCES_DOC_PATH = "/docs/hosted-instances" as const;

/** Link to a hosted instance section (Starlight heading anchor on the hosted instances page). */
export function getHostedEnsNodeInstanceDocUrl(headingAnchor: string): string {
  return `${HOSTED_INSTANCES_DOC_PATH}#${headingAnchor}`;
}

/** ENSAdmin Omnigraph playground deep link (opens in browser). */
export function buildEnsadminOmnigraphUrl(params: {
  ensadminBaseUrl: string;
  query: string;
  connection: string;
  variables: Record<string, unknown>;
}): string {
  const url = new URL("/api/omnigraph", params.ensadminBaseUrl);
  url.searchParams.set("query", params.query);
  url.searchParams.set("connection", params.connection);
  url.searchParams.set("variables", stringifyJsonForDocs(params.variables));
  return url.toString();
}
