import enssdkPackageJson from "@workspace/packages/enssdk/package.json";
import pnpmWorkspaceYaml from "@workspace/pnpm-workspace.yaml?raw";

const pnpmCatalog = parsePnpmCatalog(pnpmWorkspaceYaml);

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
    if (packageName === "enssdk") {
      return enssdkPackageJson.version;
    }
    throw new Error(`Unsupported workspace dependency "${packageName}" in playground manifest`);
  }

  return specifier;
}

function parsePnpmCatalog(source: string): Record<string, string> {
  const catalog: Record<string, string> = {};
  let inCatalog = false;

  for (const line of source.split("\n")) {
    if (line === "catalog:") {
      inCatalog = true;
      continue;
    }
    if (inCatalog && /^[^\s]/.test(line)) {
      break;
    }
    if (!inCatalog) {
      continue;
    }

    const match = line.match(/^ {2}(.+?): (.+)$/);
    if (!match) {
      continue;
    }

    const packageName = match[1].replace(/^"(.+)"$/, "$1");
    catalog[packageName] = match[2].trim();
  }

  return catalog;
}

/** Prefer an exact version from enssdk devDependencies when satisfying a peer range. */
export function resolveEnssdkPeerSpecifier(packageName: string, peerSpecifier: string): string {
  const enssdkDev = enssdkPackageJson.devDependencies as Record<string, string> | undefined;
  const pinnedInEnssdk = enssdkDev?.[packageName];
  if (
    pinnedInEnssdk &&
    !pinnedInEnssdk.startsWith("catalog:") &&
    !pinnedInEnssdk.startsWith("workspace:")
  ) {
    return pinnedInEnssdk;
  }

  if (packageName in pnpmCatalog) {
    return pnpmCatalog[packageName];
  }

  return resolveMonorepoSpecifier(packageName, peerSpecifier);
}
