export function isHttpEndpointURL(url: URL): boolean {
  return ["http:", "https:"].includes(url.protocol);
}

export function isWebSocketEndpointURL(url: URL): boolean {
  return ["ws:", "wss:"].includes(url.protocol);
}
