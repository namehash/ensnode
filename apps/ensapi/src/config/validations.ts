import packageJson from "@/../package.json" with { type: "json" };

import type { ENSIndexerPublicConfig, UnixTimestamp } from "@ensnode/ensnode-sdk";
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
  if (ensIndexerPublicConfig.versionInfo.ensRainbow !== packageJson.version) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexerPublicConfig.versionInfo.ensRainbow"],
      input: ensIndexerPublicConfig.versionInfo.ensRainbow,
      message: `Version Mismatch: ENSRainbow@${ensIndexerPublicConfig.versionInfo.ensRainbow} !== ENSApi@${packageJson.version}`,
    });
  }
}

// Invariant: ensHolidayAwardsEnd must be greater than or equal to ensHolidayAwardsStart
export function invariant_ensHolidayAwardsEndAfterStart(
  ctx: ZodCheckFnInput<{
    ensHolidayAwardsStart: UnixTimestamp;
    ensHolidayAwardsEnd: UnixTimestamp;
  }>,
) {
  const {
    value: { ensHolidayAwardsStart, ensHolidayAwardsEnd },
  } = ctx;

  if (ensHolidayAwardsEnd < ensHolidayAwardsStart) {
    ctx.issues.push({
      code: "custom",
      path: ["ensHolidayAwardsEnd"],
      input: ensHolidayAwardsEnd,
      message: `ensHolidayAwardsEnd (${ensHolidayAwardsEnd}) must be greater than or equal to ensHolidayAwardsStart (${ensHolidayAwardsStart})`,
    });
  }
}
