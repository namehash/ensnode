/** Pretty-print JSON for Starlight `Code` blocks and ENSAdmin query params. */
export function stringifyJsonForDocs(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** GraphQL POST body for Omnigraph curl examples. */
function buildOmnigraphCurlRequestBody(params: {
  query: string;
  variables: Record<string, unknown>;
}): string {
  const compactQuery = params.query.replace(/\s+/g, " ").trim();
  return `{
  "query": ${JSON.stringify(compactQuery)},
  "variables": ${JSON.stringify(params.variables)}
}`;
}

/** Single-quoted shell strings cannot contain raw apostrophes. */
function isSafeForSingleQuotedShellPayload(payload: string): boolean {
  return !payload.includes("'");
}

function buildOmnigraphCurlExampleWithSingleQuotedBody(url: string, body: string): string {
  return [
    `# POST JSON to your ENSNode Omnigraph endpoint (same path enssdk uses).`,
    `curl -sS -X POST "${url}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${body}'`,
  ].join("\n");
}

function buildOmnigraphCurlExampleWithHeredocBody(url: string, body: string): string {
  return [
    `# POST JSON to your ENSNode Omnigraph endpoint (same path enssdk uses).`,
    `curl -sS -X POST "${url}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d @- <<'EOF'`,
    body,
    `EOF`,
  ].join("\n");
}

/**
 * Build a curl example that POSTs the same JSON body as enssdk's Omnigraph module
 * (`POST {baseUrl}/api/omnigraph` with `{ query, variables }`).
 *
 * Uses a multi-line single-quoted `-d` payload when safe; falls back to a heredoc when
 * the query or variables contain `'` (invalid inside single-quoted shell strings).
 */
export function buildOmnigraphCurlExample(params: {
  connectionBaseUrl: string;
  query: string;
  variables: Record<string, unknown>;
}): string {
  const base = params.connectionBaseUrl.replace(/\/+$/, "");
  const url = `${base}/api/omnigraph`;
  const body = buildOmnigraphCurlRequestBody(params);

  if (isSafeForSingleQuotedShellPayload(body)) {
    return buildOmnigraphCurlExampleWithSingleQuotedBody(url, body);
  }

  return buildOmnigraphCurlExampleWithHeredocBody(url, body);
}

/** Docs path for the hosted ENSNode instances catalog. */
const HOSTED_INSTANCES_DOC_PATH = "/docs/hosted-instances" as const;

/** Link to a hosted instance section (Starlight heading anchor on the hosted instances page). */
export function getHostedEnsNodeInstanceDocUrl(headingAnchor: string): string {
  return `${HOSTED_INSTANCES_DOC_PATH}#${headingAnchor}`;
}

/** ENSAdmin Omnigraph playground deep link (opens in browser). */
export function buildEnsAdminOmnigraphUrl(params: {
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
