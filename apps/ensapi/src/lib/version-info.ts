import packageJson from "@/../package.json" with { type: "json" };

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { EnsApiVersionInfo } from "@ensnode/ensnode-sdk";

/**
 * Get ENS API version
 */
function getEnsApiVersion(): string {
  return packageJson.version;
}

/**
 * Get NPM package version.
 *
 * Note:
 * Since we use PNPM's `catalog:` references, reading directly from
 * the `package.json` file would give us `catalog:` values, and not resolved
 * version values. We need the latter, so we implement our own version
 * resolution method.
 *
 * @throws If the package version cannot be found in any
 *         `node_modules` up to the workspace root.
 */
function getPackageVersion(packageName: string): string {
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
      throw new Error(`Package ${packageName} not found in any node_modules up to workspace root`);
    }

    // Move up one directory
    const parentDir = dirname(searchDir);

    // Prevent infinite loop if we reach filesystem root
    if (parentDir === searchDir) {
      throw new Error(`Package ${packageName} not found and no workspace root detected`);
    }

    searchDir = parentDir;
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
      if (entry.startsWith(`${normalizedName}@`)) {
        const pkgPath = join(pnpmDir, entry, "node_modules", packageName, "package.json");
        if (existsSync(pkgPath)) {
          const packageJson = JSON.parse(readFileSync(pkgPath, "utf8"));
          return packageJson.version;
        }
      }
    }
  } catch (_error) {
    // Ignore errors in this helper
  }

  return null;
}

export const ensApiVersionInfo = {
  ensApi: getEnsApiVersion(),
  ensNormalize: getPackageVersion("@adraffy/ens-normalize"),
} as const satisfies EnsApiVersionInfo;
