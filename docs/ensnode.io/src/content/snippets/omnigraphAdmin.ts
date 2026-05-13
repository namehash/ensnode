/** ENSAdmin Omnigraph playground (opens in browser). */
export const ENSADMIN_OMNIGRAPH_PLAYGROUND_BASE = "https://admin.ensnode.io/api/omnigraph";

export function buildEnsadminOmnigraphUrl(params: {
  query: string;
  connection: string;
  variables: Record<string, unknown>;
}): string {
  const url = new URL(ENSADMIN_OMNIGRAPH_PLAYGROUND_BASE);
  url.searchParams.set("query", params.query);
  url.searchParams.set("connection", params.connection);
  url.searchParams.set("variables", JSON.stringify(params.variables, null, 2));
  return url.toString();
}
