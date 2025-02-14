export const DEFAULT_BASE_URL = "https://subgraph.ensnode.io";

/**
 * Creates ENSNode URL.
 *
 * @param params search params
 * @returns ENSNode URL if provided URL is valid, or DEFAULT_BASE_URL
 * @throws Error if the URL provided in the env vars or the search param is invalid
 */
export function ensNodeUrl(params: URLSearchParams): URL {
  const envVarName = "VITE_ENSNODE_URL";
  const urlSearchParamName = "ensnode";

  try {
    if (params.has(urlSearchParamName)) {
      return new URL(params.get(urlSearchParamName)!.toString());
    }
  } catch {
    throw new Error(
      `Invalid URL provided in '${urlSearchParamName}' search param: '${params.get(
        urlSearchParamName,
      )}'`,
    );
  }

  try {
    if (import.meta.env[envVarName]) {
      return new URL(import.meta.env[envVarName]);
    }
  } catch {
    throw new Error(
      `Invalid URL provided in '${urlSearchParamName}' search param: '${params.get(
        urlSearchParamName,
      )}'`,
    );
  }

  return new URL(DEFAULT_BASE_URL);
}
