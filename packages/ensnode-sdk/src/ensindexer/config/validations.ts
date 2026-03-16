import type { ZodCheckFnInput } from "../../shared/zod-types";
import type { EnsIndexerVersionInfo } from "./types";

/**
 * Invariant: ensDb version is same as ensIndexer version
 */
export function invariant_ensDbVersionIsSameAsEnsIndexerVersion(
  ctx: ZodCheckFnInput<EnsIndexerVersionInfo>,
) {
  const versionInfo = ctx.value;

  if (versionInfo.ensDb !== versionInfo.ensIndexer) {
    ctx.issues.push({
      code: "custom",
      input: versionInfo,
      message: "`ensDb` version must be same as `ensIndexer` version",
    });
  }
}
