/**
 * Builds a `URL` from the given string.
 *
 * If no explicit protocol found in `rawUrl` assumes an implicit
 * 'https://' default protocol.
 *
 * @param rawUrl a string that may be in the format of a `URL`.
 * @returns a `URL` object for the given `rawUrl`.
 * @throws if `rawUrl` cannot be converted to a `URL`.
 */
const buildUrl = (rawUrl: string): URL => {
  if (!rawUrl.includes("://")) {
    // no explicit protocol found in `rawUrl`, assume implicit https:// protocol
    rawUrl = `https://${rawUrl}`;
  }

  return new URL(rawUrl);
};

/**
 * Invariants:
 *
 * A `URL` that:
 * - has protocol that is either 'http:' or 'https:'
 * - has a hostname that:
 *   - contains at least one dot or is "localhost"
 *   - does not start or end with dots or have consecutive dots (no empty labels)
 * - does not include a non-root path, query params, or link fragment
 * - optionally includes a port
 *
 * For simplicity, at this time no further validation is performed.
 */
export type HttpHostname = URL;

export type BuildHttpHostnameResult =
  | { isValid: true; url: HttpHostname }
  | { isValid: false; error: string };

/**
 * Builds a validated `HttpHostname` from a raw URL.
 *
 * @param rawUrl - a string that may be in the format of a URL
 * @returns a `BuildHttpHostnameResult` with either a valid `HttpHostname`
 *          or `error` message describing why the `rawUrl` cannot be converted
 *          to a `HttpHostname`.
 */
export const buildHttpHostname = (rawUrl: string): BuildHttpHostnameResult => {
  let url: URL;
  try {
    url = buildUrl(rawUrl);
  } catch {
    return {
      isValid: false,
      error: "Invalid URL",
    };
  }

  // validate protocol as HTTP or HTTPS (case insensitive)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      isValid: false,
      error: "URL must use HTTP or HTTPS protocol",
    };
  }

  // validate hostname as containing at least one dot or be localhost
  // ex: if the hostname is "abc" it's assumed to be invalid
  if (!url.hostname.includes(".") && url.hostname !== "localhost") {
    return {
      isValid: false,
      error: "Invalid hostname",
    };
  }

  // URL constructor accepts hostnames with empty labels, but we reject them
  if (url.hostname.startsWith(".") || url.hostname.includes("..") || url.hostname.endsWith(".")) {
    return {
      isValid: false,
      error: "Invalid hostname",
    };
  }

  if (url.pathname !== "/") {
    return {
      isValid: false,
      error: "URL must not include a non-root path (e.g. '/path/to/resource')",
    };
  }

  if (url.search !== "") {
    return {
      isValid: false,
      error: "URL must not include query params (e.g. '?query=value')",
    };
  }

  if (url.hash !== "") {
    return {
      isValid: false,
      error: "URL must not include a link fragment (e.g. '#anchor')",
    };
  }

  return {
    isValid: true,
    url: url,
  };
};

/**
 * Converts a list of raw URLs into a list of `HttpHostname` objects.
 *
 * Any urls in the input that cannot be converted to a `HttpHostname` will be
 * excluded from the resulting list.
 *
 * Note: this does not deduplicate the URLs as full deduplication of URLs
 * is a lot more complicated than it seems. Ex: implicit ports, http vs https,
 * capitalization of hostnames, ip address vs hostname, etc..
 *
 * @param rawUrls A list of raw URLs
 * @returns A list of `HttpHostname` objects
 */
export const buildHttpHostnames = (rawUrls: string[]): HttpHostname[] => {
  const allResults = rawUrls.map((rawUrl) => buildHttpHostname(rawUrl));
  const validResults = allResults.filter((result) => result.isValid);
  return validResults.map((result) => result.url);
};
