/**
 * Bootstrap helpers for ENSIndexer
 *
 * This library covers functionality useful during the ENSIndexer bootstrap phase,
 * when all dependencies are fetched and validated before ENSIndexer service
 * becomes operational and ready to be used.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getENSRainbowApiCLient } from "@/lib/ensraibow-api-client";

/**
 * Get NPM package version.
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
 * Get Version Info from ENSRainbow service.
 */
export async function getENSRainbowVersionInfo(ensRainbowEndpointUrl: URL) {
  const ensRainbowApiClient = getENSRainbowApiCLient(ensRainbowEndpointUrl);

  return ensRainbowApiClient.version();
}
