import { z } from "zod/v4";

export const makeEnsDbPublicConfigSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "EnsDbPublicConfig";

  return z
    .object({
      postgreSqlVersion: z
        .string()
        .nonempty(`${label}.postgreSqlVersion must be a non-empty string`)
        .describe("Version of the PostgreSQL server hosting the ENSDb instance."),
    })
    .describe(label);
};
