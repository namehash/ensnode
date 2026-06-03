/**
 * Throws if `value` contains characters an agent should never produce inside a name, label, or hash
 * but frequently hallucinates: control characters (0x00–0x1F, 0x7F), and `?`/`#`/`%` from pasting URL
 * fragments or double-encoding. Reject them before any network call so failures are loud and local
 * rather than silently mis-resolved.
 */
export function assertCleanIdentifier(value: string, label: string): void {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isControlChar = code <= 0x1f || code === 0x7f;
    if (isControlChar || char === "?" || char === "#" || char === "%") {
      throw new Error(
        `Invalid ${label}: contains forbidden characters (control characters, "?", "#", or "%").`,
      );
    }
  }
}
