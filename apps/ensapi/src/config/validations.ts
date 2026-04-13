import packageJson from "@/../package.json" with { type: "json" };

import type { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import type { ZodCheckFnInput } from "@ensnode/ensnode-sdk/internal";

import { ensApiVersionInfo } from "@/lib/version-info";

// Invariant: ENSIndexerPublicConfig VersionInfo must match ENSApi
export function invariant_ensIndexerPublicConfigVersionInfo(
  ctx: ZodCheckFnInput<{
    ensIndexerPublicConfig: ENSIndexerPublicConfig;
  }>,
) {
  const {
    value: { ensIndexerPublicConfig },
  } = ctx;

  // Invariant: ENSApi & ENSDB must match version numbers
  if (ensIndexerPublicConfig.versionInfo.ensDb !== packageJson.version) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexerPublicConfig.versionInfo.ensDb"],
      input: ensIndexerPublicConfig.versionInfo.ensDb,
      message: `Version Mismatch: ENSDB@${ensIndexerPublicConfig.versionInfo.ensDb} !== ENSApi@${packageJson.version}`,
    });
  }

  // Invariant: ENSApi & ENSIndexer must match version numbers
  if (ensIndexerPublicConfig.versionInfo.ensIndexer !== packageJson.version) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexerPublicConfig.versionInfo.ensIndexer"],
      input: ensIndexerPublicConfig.versionInfo.ensIndexer,
      message: `Version Mismatch: ENSIndexer@${ensIndexerPublicConfig.versionInfo.ensIndexer} !== ENSApi@${packageJson.version}`,
    });
  }

  // Invariant: ENSApi & ENSRainbow must match version numbers
  if (ensIndexerPublicConfig.ensRainbowPublicConfig.version !== packageJson.version) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexerPublicConfig.ensRainbowPublicConfig.version"],
      input: ensIndexerPublicConfig.ensRainbowPublicConfig.version,
      message: `Version Mismatch: ENSRainbow@${ensIndexerPublicConfig.ensRainbowPublicConfig.version} !== ENSApi@${packageJson.version}`,
    });
  }

  // Invariant: `@adraffy/ens-normalize` package version must match between ENSApi & ENSIndexer
  if (ensIndexerPublicConfig.versionInfo.ensNormalize !== ensApiVersionInfo.ensNormalize) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexerPublicConfig.versionInfo.ensNormalize"],
      input: ensIndexerPublicConfig.versionInfo.ensNormalize,
      message: `Dependency Version Mismatch: '@adraffy/ens-normalize' version must be the same between ENSIndexer and ENSApi. Found ENSApi@${ensApiVersionInfo.ensNormalize} and ENSIndexer@${ensIndexerPublicConfig.versionInfo.ensNormalize}`,
    });
  }
}
