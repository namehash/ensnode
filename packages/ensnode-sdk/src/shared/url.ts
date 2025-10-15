/**
 * Type alias for URLs to assets that are supported by browsers for direct rendering.
 * Assets must be accessible via the http, https, or data protocol.
 *
 * Invariant: value guaranteed to pass isBrowserSupportedProtocol check.
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
 * Checks if a URL uses a protocol that is supported by browsers for direct asset rendering.
 * Supported protocols include http, https, and data.
 *
 * @param url - The URL to check
 * @returns true if the URL protocol is http:, https:, or data:
 *
 * @example
 * ```typescript
 * const httpUrl = new URL('https://example.com/image.png');
 * isBrowserSupportedProtocol(httpUrl); // true
 *
 * const dataUrl = new URL('data:image/svg+xml;base64,PHN2Zy8+');
 * isBrowserSupportedProtocol(dataUrl); // true
 *
 * const ipfsUrl = new URL('ipfs://QmHash');
 * isBrowserSupportedProtocol(ipfsUrl); // false
 * ```
 */
export function isBrowserSupportedProtocol(url: URL): boolean {
  return ["http:", "https:", "data:"].includes(url.protocol);
}

/**
 * Validates and converts a URL string to a BrowserSupportedAssetUrl.
 *
 * This function normalizes the URL string (adding 'https://' if no protocol is specified),
 * then validates that the resulting URL uses a browser-supported protocol (http/https/data)
 * before returning it as a BrowserSupportedAssetUrl type.
 *
 * Special handling for data: URLs - they are parsed directly without normalization to preserve
 * the data content integrity.
 *
 * @param urlString - The URL string to validate and convert. If no protocol is specified, 'https://' will be prepended.
 * @returns A BrowserSupportedAssetUrl if the protocol is (or becomes) http/https/data
 * @throws if the URL string is invalid or uses a non-browser-supported protocol
 *
 * @example
 * ```typescript
 * // Explicit protocol - no transformation
 * toBrowserSupportedUrl('https://example.com') // returns URL with https://
 * toBrowserSupportedUrl('http://example.com')  // returns URL with http://
 *
 * // Data URLs - direct parsing without normalization (ENS avatar standard compliant)
 * toBrowserSupportedUrl('data:image/svg+xml;base64,PHN2Zy8+') // returns data: URL
 *
 * // Implicit protocol - adds https://
 * toBrowserSupportedUrl('example.com') // returns URL with https://example.com
 *
 * // Non-browser-supported protocols - throws error
 * toBrowserSupportedUrl('ipfs://QmHash') // throws Error
 * ```
 */
export function toBrowserSupportedUrl(urlString: string): BrowserSupportedAssetUrl {
  // data: URLs should be parsed directly without normalization
  // buildUrl() would incorrectly prepend https:// to them
  let url: URL;
  if (urlString.startsWith("data:")) {
    url = new URL(urlString);
  } else {
    url = buildUrl(urlString);
  }

  if (!isBrowserSupportedProtocol(url)) {
    throw new Error(
      `BrowserSupportedAssetUrl must use http, https, or data protocol, got: ${url.protocol}`,
    );
  }

  return url;
}
