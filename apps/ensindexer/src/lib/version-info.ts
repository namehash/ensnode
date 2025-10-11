import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";
import { type ENSIndexerVersionInfo, SerializedENSIndexerVersionInfo } from "@ensnode/ensnode-sdk";
import { makeENSIndexerVersionInfoSchema } from "@ensnode/ensnode-sdk/internal";
import { prettifyError } from "zod/v4";

/**
 * Get version of ENSIndexer application.
 */
export async function getENSIndexerVersion(): Promise<string> {
  return import("@/../package.json").then(({ version }) => version);
}

/**
 * Get NPM package version.
 *
 * Note:
 * Since we use PNPM's `catalog:` references, reading directly from
 * the `package.json` file would give us `catalog:` values, and not resolved
 * version values. We need the later, so we implement our own version
 * resolution method.
 */
export function getPackageVersion(packageName: string) {
  try {
    // Start from current file's directory
    const currentFile = fileURLToPath(import.meta.url);
    let searchDir = dirname(currentFile);

    while (true) {
      const workspaceFile = join(searchDir, "pnpm-workspace.yaml");
      const isWorkspaceRoot = existsSync(workspaceFile);

      // Check for node_modules in current directory
      const nodeModulesPath = join(searchDir, "node_modules", packageName, "package.json");
      if (existsSync(nodeModulesPath)) {
        const packageJson = JSON.parse(readFileSync(nodeModulesPath, "utf8"));
        return packageJson.version;
      }

      // Check PNPM's .pnpm virtual store
      const pnpmDir = join(searchDir, "node_modules", ".pnpm");
      if (existsSync(pnpmDir)) {
        const version = getPackageVersionFromPnpmStore(pnpmDir, packageName);
        if (version) return version;
      }

      // If we're at workspace root and still haven't found it, stop searching
      if (isWorkspaceRoot) {
        throw new Error(
          `Package ${packageName} not found in any node_modules up to workspace root`,
        );
      }

      // Move up one directory
      const parentDir = dirname(searchDir);

      // Prevent infinite loop if we reach filesystem root
      if (parentDir === searchDir) {
        throw new Error(`Package ${packageName} not found and no workspace root detected`);
      }

      searchDir = parentDir;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.warn(`Could not find version for ${packageName}:`, errorMessage);

    return "unknown";
  }
}

/**
 * Get package version from PNPM virtual store.
 *
 * PNPM stores packages in its virtual store that
 * can be located at, for example, `./node_modules/.pnpm` path.
 *
 * This function is used in a fallback method by {@link getPackageVersion} to
 * get package version by package name in case it was not found
 * directly in `./node_modules` directory.
 */
function getPackageVersionFromPnpmStore(pnpmDir: string, packageName: string): string | null {
  try {
    const entries = readdirSync(pnpmDir);

    // Convert package name to PNPM's format: @scope/name -> @scope+name
    const normalizedName = packageName.replace("/", "+");

    // Find entries that match the package name
    // They will be in format: packagename@version or @scope+packagename@version
    for (const entry of entries) {
      if (entry.startsWith(normalizedName + "@")) {
        const pkgPath = join(pnpmDir, entry, "node_modules", packageName, "package.json");
        if (existsSync(pkgPath)) {
          const packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
          return packageJson.version;
        }
      }
    }
  } catch (error) {
    // Ignore errors in this helper
  }

  return null;
}

/**
 * Get complete {@link ENSIndexerVersionInfo} for ENSIndexer app.
 */
export async function getENSIndexerVersionInfo(): Promise<ENSIndexerVersionInfo> {
  const ensRainbowApiClient = getENSRainbowApiClient();
  const { versionInfo: ensRainbowVersionInfo } = await ensRainbowApiClient.version();

  // ENSRainbow version (fetched dynamically from the connected ENSRainbow service instance)
  const ensRainbowSchema = ensRainbowVersionInfo.dbSchemaVersion;

  // ENSIndexer version
  const ensIndexerVersion = await getENSIndexerVersion();

  // ENSDb version
  // ENSDb version is always the same as the ENSIndexer version number
  const ensDbVersion = ensIndexerVersion;

  // parse unvalidated version info
  const schema = makeENSIndexerVersionInfoSchema();
  const parsed = schema.safeParse({
    ensRainbow: ensRainbowVersionInfo.version,
    nodejs: process.versions.node,
    ponder: getPackageVersion("ponder"),
    ensDb: ensDbVersion,
    ensIndexer: ensIndexerVersion,
    ensNormalize: getPackageVersion("@adraffy/ens-normalize"),
    ensRainbowSchema,
  } satisfies SerializedENSIndexerVersionInfo);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ENSIndexerVersionInfo:\n${prettifyError(parsed.error)}\n`);
  }

  // return version info we have now validated
  return parsed.data;
}
