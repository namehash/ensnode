/**
 * Beautifies a URL by removing the protocol and unnecessary trailing slash.
 *
 * @param url - The URL to beautify.
 * @returns The beautified URL string.
 */
export function beautifyUrl(url: URL): string {
  let s = `${url.host}${url.pathname}${url.search}${url.hash}`;

  if (s.endsWith("/") && !url.search && !url.hash) {
    s = s.slice(0, -1);
  }

  return s;
}
