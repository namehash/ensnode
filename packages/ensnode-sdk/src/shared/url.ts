/**
 * Type alias for URLs to assets that are supported by browsers for direct rendering.
 * Assets must be accessible via the http or https protocol.
 *
 * Invariant: value guaranteed to pass isHttpProtocol check.
 */
export type BrowserSupportedAssetUrl = URL;

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
export function buildUrl(rawUrl: string): URL {
  if (!rawUrl.includes("://")) {
    // no explicit protocol found in `rawUrl`, assume implicit https:// protocol
    rawUrl = `https://${rawUrl}`;
  }

  return new URL(rawUrl);
}

export function isHttpProtocol(url: URL): boolean {
  return ["http:", "https:"].includes(url.protocol);
}

export function isWebSocketProtocol(url: URL): boolean {
  return ["ws:", "wss:"].includes(url.protocol);
}

/**
 * Validates and converts a URL string to a BrowserSupportedAssetUrl.
 *
 * This function normalizes the URL string (adding 'https://' if no protocol is specified),
 * then validates that the resulting URL uses a browser-supported protocol (http/https)
 * before returning it as a BrowserSupportedAssetUrl type.
 *
 * @param urlString - The URL string to validate and convert. If no protocol is specified, 'https://' will be prepended.
 * @returns A BrowserSupportedAssetUrl if the protocol is (or becomes) http/https
 * @throws if the URL string is invalid or uses a non-http/https protocol
 *
 * @example
 * ```typescript
 * // Explicit protocol - no transformation
 * toBrowserSupportedUrl('https://example.com') // returns URL with https://
 * toBrowserSupportedUrl('http://example.com')  // returns URL with http://
 *
 * // Implicit protocol - adds https://
 * toBrowserSupportedUrl('example.com') // returns URL with https://example.com
 *
 * // Non-browser-supported protocols - throws error
 * toBrowserSupportedUrl('ipfs://QmHash') // throws Error
 * ```
 */
export function toBrowserSupportedUrl(urlString: string): BrowserSupportedAssetUrl {
  const url = buildUrl(urlString);

  if (!isHttpProtocol(url)) {
    throw new Error(
      `BrowserSupportedAssetUrl must use http or https protocol, got: ${url.protocol}`,
    );
  }

  return url;
}
