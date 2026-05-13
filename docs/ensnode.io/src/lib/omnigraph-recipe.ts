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
