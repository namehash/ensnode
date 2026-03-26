import packageJson from "@/../package.json" with { type: "json" };

import type { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import type { ZodCheckFnInput } from "@ensnode/ensnode-sdk/internal";

// Invariant: ENSIndexerPublicConfig VersionInfo must match ENSApi
export function invariant_ensIndexerPublicConfigVersionInfo(
  ctx: ZodCheckFnInput<{
    ensIndexerPublicConfig: ENSIndexerPublicConfig;
  }>,
) {
  const {
    value: { ensIndexerPublicConfig },
  } = ctx;

  const { ensRainbowPublicConfig, versionInfo } = ensIndexerPublicConfig;

  // Invariant: ENSApi & ENSDB must match version numbers
  if (versionInfo.ensDb !== packageJson.version) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexerPublicConfig.versionInfo.ensDb"],
      input: versionInfo.ensDb,
      message: `Version Mismatch: ENSDB@${versionInfo.ensDb} !== ENSApi@${packageJson.version}`,
    });
  }

  // Invariant: ENSApi & ENSIndexer must match version numbers
  if (versionInfo.ensIndexer !== packageJson.version) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexerPublicConfig.versionInfo.ensIndexer"],
      input: versionInfo.ensIndexer,
      message: `Version Mismatch: ENSIndexer@${versionInfo.ensIndexer} !== ENSApi@${packageJson.version}`,
    });
  }

  // Invariant: ENSApi & ENSRainbow must match version numbers
  if (
    typeof ensRainbowPublicConfig !== "undefined" &&
    ensRainbowPublicConfig.version !== packageJson.version
  ) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexerPublicConfig.ensRainbowPublicConfig.version"],
      input: ensRainbowPublicConfig.version,
      message: `Version Mismatch: ENSRainbow@${ensRainbowPublicConfig.version} !== ENSApi@${packageJson.version}`,
    });
  }
}
