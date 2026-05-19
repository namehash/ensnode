import enskitExamplePackageJson from "@workspace/examples/enskit-react-example/package.json";
import enssdkExamplePackageJson from "@workspace/examples/enssdk-example/package.json";
import enskitPackageJson from "@workspace/packages/enskit/package.json";
import enssdkPackageJson from "@workspace/packages/enssdk/package.json";

import { resolveMonorepoSpecifier, resolvePeerSpecifier } from "./resolveMonorepoSpecifier";
import type { PlaygroundPackageManifest } from "./types";

function resolveDependencyBlock(block: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [name, specifier] of Object.entries(block)) {
    resolved[name] = resolveMonorepoSpecifier(name, specifier);
  }
  return resolved;
}

function addPeerDependencies(
  manifest: PlaygroundPackageManifest,
  packages: Array<{ peerDependencies: Record<string, string> }>,
): void {
  for (const pkg of packages) {
    for (const [name, specifier] of Object.entries(pkg.peerDependencies)) {
      if (name in manifest.dependencies || name in manifest.devDependencies) {
        continue;
      }
      manifest.devDependencies[name] = resolvePeerSpecifier(name, specifier, [
        enssdkPackageJson,
        enskitPackageJson,
      ]);
    }
  }
}

/**
 * StackBlitz manifest aligned with `examples/enssdk-example/package.json`.
 */
export function resolveEnssdkExamplePackageManifest(): PlaygroundPackageManifest {
  const dependencies = resolveDependencyBlock(enssdkExamplePackageJson.dependencies);
  const devDependencies = resolveDependencyBlock(enssdkExamplePackageJson.devDependencies);

  const manifest: PlaygroundPackageManifest = { dependencies, devDependencies };
  addPeerDependencies(manifest, [enssdkPackageJson]);

  return manifest;
}

/**
 * StackBlitz manifest aligned with `examples/enskit-react-example/package.json`.
 */
export function resolveEnskitExamplePackageManifest(): PlaygroundPackageManifest {
  const dependencies = resolveDependencyBlock(enskitExamplePackageJson.dependencies);
  const devDependencies = resolveDependencyBlock(enskitExamplePackageJson.devDependencies);

  const manifest: PlaygroundPackageManifest = { dependencies, devDependencies };
  addPeerDependencies(manifest, [enskitPackageJson, enssdkPackageJson]);

  return manifest;
}
