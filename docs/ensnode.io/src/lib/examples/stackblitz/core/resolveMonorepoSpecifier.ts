import enskitPackageJson from "@workspace/packages/enskit/package.json";
import enssdkPackageJson from "@workspace/packages/enssdk/package.json";
import pnpmWorkspaceYaml from "@workspace/pnpm-workspace.yaml?raw";
import { parse } from "yaml";

const pnpmCatalog = parsePnpmCatalog(pnpmWorkspaceYaml);

const workspacePackageVersions: Record<string, string> = {
  enssdk: enssdkPackageJson.version,
  enskit: enskitPackageJson.version,
};

/** Resolve pnpm `catalog:` / `workspace:` specifiers to strings npm can install in StackBlitz. */
export function resolveMonorepoSpecifier(packageName: string, specifier: string): string {
  if (specifier === "catalog:" || specifier.startsWith("catalog:")) {
    const version = pnpmCatalog[packageName];
    if (!version) {
      throw new Error(`No pnpm catalog entry for "${packageName}" (specifier: ${specifier})`);
    }
    return version;
  }

  if (specifier.startsWith("workspace:")) {
    const version = workspacePackageVersions[packageName];
    if (!version) {
      throw new Error(`Unsupported workspace dependency "${packageName}" in playground manifest`);
    }
    return version;
  }

  return specifier;
}

export function parsePnpmCatalog(source: string): Record<string, string> {
  const doc = parse(source) as { catalog?: Record<string, string> };
  const catalog = doc.catalog ?? {};

  if (Object.keys(catalog).length === 0) {
    throw new Error("Failed to parse pnpm catalog from pnpm-workspace.yaml");
  }

  return catalog;
}

type PackageJsonWithPeers = {
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/** Satisfy a peer dependency using package devDependency pins, then the pnpm catalog. */
export function resolvePeerSpecifier(
  packageName: string,
  peerSpecifier: string,
  packages: PackageJsonWithPeers[],
): string {
  for (const pkg of packages) {
    const pinnedInDev = pkg.devDependencies?.[packageName];
    if (
      pinnedInDev &&
      !pinnedInDev.startsWith("catalog:") &&
      !pinnedInDev.startsWith("workspace:")
    ) {
      return pinnedInDev;
    }
  }

  if (packageName in pnpmCatalog) {
    return pnpmCatalog[packageName];
  }

  return resolveMonorepoSpecifier(packageName, peerSpecifier);
}
