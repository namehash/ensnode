export const DEFAULT_BASE_URL = "https://subgraph.ensnode.io";

export function removeTrailingSlash(value?: string | null): string {
  return typeof value === "string" ? value.replace(/\/+$/, "") : "";
}

export function getEnsNodeUrl(params: URLSearchParams) {
  return removeTrailingSlash(params.get("ensnode") || DEFAULT_BASE_URL);
}
