import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";
import { getDefaultEnsNodeUrl } from "@ensnode/ensnode-sdk";
import { DEFAULT_ENSRAINBOW_URL } from "@ensnode/ensrainbow-sdk";

/**
 * Minimal `.env` reader. Parses `cwd/.env` once into a map and never mutates `process.env`, so the
 * resolution precedence (CLI flag > process env > `.env`) stays explicit at each call site.
 */
let dotEnv: Record<string, string> | null = null;
function readDotEnv(): Record<string, string> {
  if (dotEnv) return dotEnv;
  dotEnv = {};
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return dotEnv;

  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    dotEnv[key] = value;
  }
  return dotEnv;
}

/** Reads an env var with `.env` fallback (real env wins). */
function fromEnv(key: string): string | undefined {
  return process.env[key] ?? readDotEnv()[key];
}

/** Reads a CLI flag from citty's parsed args, tolerating both kebab and camelCase keys. */
function flag(args: Record<string, unknown>, name: string): string | undefined {
  const camel = name.replace(/-([a-z])/g, (_match, c: string) => c.toUpperCase());
  const value = args[name] ?? args[camel];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

const NAMESPACES = Object.values(ENSNamespaceIds);
function isNamespace(value: string): value is ENSNamespaceId {
  return (NAMESPACES as string[]).includes(value);
}

/** Resolves the ENS namespace from `--namespace` / `NAMESPACE`, defaulting to mainnet. */
export function resolveNamespace(args: Record<string, unknown>): ENSNamespaceId {
  const raw = flag(args, "namespace") ?? fromEnv("NAMESPACE") ?? ENSNamespaceIds.Mainnet;
  if (!isNamespace(raw)) {
    throw new Error(`Invalid namespace "${raw}". Expected one of: ${NAMESPACES.join(", ")}.`);
  }
  return raw;
}

/**
 * Resolves the ENSNode instance URL: explicit `--ensnode-url` / `ENSNODE_URL` wins, otherwise the
 * hosted default for the namespace. Namespaces without a hosted default (e.g. ens-test-env) throw a
 * clear error directing the user to pass a URL.
 */
export function resolveEnsNodeUrl(args: Record<string, unknown>): URL {
  const explicit = flag(args, "ensnode-url") ?? fromEnv("ENSNODE_URL");
  if (explicit) return new URL(explicit);

  const namespace = resolveNamespace(args);
  try {
    return getDefaultEnsNodeUrl(namespace);
  } catch {
    throw new Error(
      `No hosted ENSNode instance is available for namespace "${namespace}". Pass --ensnode-url or set ENSNODE_URL.`,
    );
  }
}

/** Resolves the ENSRainbow instance URL: explicit `--ensrainbow-url` / `ENSRAINBOW_URL` wins. */
export function resolveEnsRainbowUrl(args: Record<string, unknown>): URL {
  const explicit = flag(args, "ensrainbow-url") ?? fromEnv("ENSRAINBOW_URL");
  return new URL(explicit ?? DEFAULT_ENSRAINBOW_URL);
}
