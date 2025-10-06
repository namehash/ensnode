/**
 * Type alias for URLs to assets that are supported by browsers for direct rendering.
 * Assets must be accessible via the http or https protocol.
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
 * This function strictly validates that the URL uses a browser-supported protocol (http/https)
 * before returning it as a BrowserSupportedAssetUrl type.
 *
 * @param urlString - The URL string to validate (must include protocol)
 * @returns A BrowserSupportedAssetUrl if the protocol is http/https
 * @throws if the URL string is invalid or uses an unsupported protocol
 */
export function toBrowserSupportedUrl(urlString: string): BrowserSupportedAssetUrl {
  const url = new URL(urlString);

  if (!isHttpProtocol(url)) {
    throw new Error(`URL must use http or https protocol, got: ${url.protocol}`);
  }

  return url;
}
