import enssdkExamplePackageJson from "@workspace/examples/enssdk-example/package.json";
import enssdkPackageJson from "@workspace/packages/enssdk/package.json";

import { resolveEnssdkPeerSpecifier, resolveMonorepoSpecifier } from "./resolveMonorepoSpecifier";
import type { PlaygroundPackageManifest } from "./types";

function resolveDependencyBlock(block: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [name, specifier] of Object.entries(block)) {
    resolved[name] = resolveMonorepoSpecifier(name, specifier);
  }
  return resolved;
}

/**
 * StackBlitz manifest aligned with `examples/enssdk-example/package.json`.
 * Specifiers are taken from the example (and enssdk peers where needed), not duplicated by hand.
 */
export function resolveEnssdkExamplePackageManifest(): PlaygroundPackageManifest {
  const dependencies = resolveDependencyBlock(enssdkExamplePackageJson.dependencies);
  const devDependencies = resolveDependencyBlock(enssdkExamplePackageJson.devDependencies);

  for (const [name, specifier] of Object.entries(enssdkPackageJson.peerDependencies)) {
    if (name in devDependencies) {
      continue;
    }
    devDependencies[name] = resolveEnssdkPeerSpecifier(name, specifier);
  }

  return { dependencies, devDependencies };
}
