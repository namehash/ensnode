export function isHttpProtocol(url: URL): boolean {
  return ["http:", "https:"].includes(url.protocol);
}

export function isWebSocketProtocol(url: URL): boolean {
  return ["ws:", "wss:"].includes(url.protocol);
}
