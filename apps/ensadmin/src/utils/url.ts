export const DEFAULT_BASE_URL = "https://subgraph.ensnode.io";

/**
 * Creates ENSIndexer URL.
 *
 * @param params search params
 * @returns ENSIndexer URL if provided URL is valid, or DEFAULT_BASE_URL
 * @throws Error if the URL provided in the env vars or the search param is invalid
 */
export function ensIndexerUrl(params: URLSearchParams): URL {
  const envVarName = "VITE_ENSINDEXER_URL";
  const urlSearchParamName = "ensindexer";

  try {
    const rawUrlSearchParamName = params.get(urlSearchParamName);

    if (rawUrlSearchParamName) {
      return new URL(rawUrlSearchParamName.toString());
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
