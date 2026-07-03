import { z } from "zod/v4";

import type { GitEnvironment } from "./environments";
import { GitCommitShaSchema } from "./zod-schemas";

/**
 * Build the commit reference from the given environment.
 * @param env The environment containing the GIT_COMMIT variable.
 * @returns The commit reference or undefined if not available
 * @throws Will throw if the GIT_COMMIT variable is invalid.
 */
export function buildCommitRef(env: GitEnvironment): string | undefined {
  const result = z
    .preprocess((val) => (val === "" ? undefined : val), z.optional(GitCommitShaSchema))
    .safeParse(env.GIT_COMMIT);

  if (!result.success) {
    throw new Error("Cannot build commit reference: invalid GIT_COMMIT value");
  }

  return result.data;
}
