import type { RawExampleProject } from "./types";

/**
 * Normalize Vite `import.meta.glob(..., { query: "?raw", eager: true })` keys to paths
 * relative to the example root (e.g. `src/index.ts`).
 */
export function normalizeGlobModules(
  modules: Record<string, string | { default: string }>,
  pathPrefix: string,
): Record<string, string> {
  const files: Record<string, string> = {};

  for (const [key, value] of Object.entries(modules)) {
    const content = typeof value === "string" ? value : value.default;
    const normalizedKey = key.replace(/\\/g, "/");
    const marker = `${pathPrefix}/`;
    const index = normalizedKey.indexOf(marker);
    const relativePath =
      index >= 0
        ? normalizedKey.slice(index + marker.length)
        : (normalizedKey.split("/").pop() ?? key);

    files[relativePath] = content;
  }

  return files;
}

export function fetchRawExampleProjectFromGlob(
  modules: Record<string, string | { default: string }>,
  pathPrefix: string,
): RawExampleProject {
  return { files: normalizeGlobModules(modules, pathPrefix) };
}
