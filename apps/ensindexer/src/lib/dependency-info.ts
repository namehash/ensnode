import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";
import { DependencyInfo } from "@ensnode/ensnode-sdk";
import { makeDependencyInfoSchema } from "@ensnode/ensnode-sdk/internal";
import { prettifyError } from "zod/v4";

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
      // Check if we've reached the workspace root
      const workspaceFile = join(searchDir, "pnpm-workspace.yaml");
      const isWorkspaceRoot = existsSync(workspaceFile);

      // Check for node_modules in current directory
      const nodeModulesPath = join(searchDir, "node_modules", packageName, "package.json");

      if (existsSync(nodeModulesPath)) {
        const packageJson = JSON.parse(readFileSync(nodeModulesPath, "utf8"));
        return packageJson.version;
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
 * Get complete {@link DependencyInfo} for ENSIndexer app.
 */
export async function getDependencyInfo(): Promise<DependencyInfo> {
  const ensRainbowApiClient = getENSRainbowApiClient();
  const { versionInfo: ensRainbowDependencyInfo } = await ensRainbowApiClient.version();

  const schema = makeDependencyInfoSchema();
  const data = {
    ensRainbow: ensRainbowDependencyInfo.version,
    ensRainbowSchema: ensRainbowDependencyInfo.schema_version,
    nodejs: process.versions.node,
    ponder: getPackageVersion("ponder"),
  } satisfies DependencyInfo;

  const parsed = schema.safeParse(data);

  if (parsed.error) {
    throw new Error(`Cannot deserialize DependencyInfo:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
