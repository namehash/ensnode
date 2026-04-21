import { z } from "zod/v4";

const makeEnsDbVersionInfoSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "EnsDbVersionInfo";

  return z
    .object({
      postgresql: z
        .string()
        .nonempty(`${label}.postgresql must be a non-empty string`)
        .describe("Version of the PostgreSQL server hosting the ENSDb instance."),
    })
    .describe(label);
};

export const makeEnsDbPublicConfigSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "EnsDbPublicConfig";

  return z
    .object({
      versionInfo: makeEnsDbVersionInfoSchema(`${label}.versionInfo`),
    })
    .describe(label);
};
