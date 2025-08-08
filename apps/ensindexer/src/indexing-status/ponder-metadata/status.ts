import { makeBlockRefSchema, makeChainIdSchema } from "@ensnode/ensnode-sdk/internal";
import type { PonderStatus } from "@ensnode/ponder-metadata";
import z, { prettifyError } from "zod/v4";

export type { PonderStatus } from "@ensnode/ponder-metadata";

/**
 * Ponder Data Schemas
 *
 * These schemas allow data validation with Zod.
 */

const makePonderStatusSchema = (valueLabel?: "Value") => {
  const chainIdSchema = makeChainIdSchema(valueLabel);
  const blockRefSchema = makeBlockRefSchema(valueLabel);

  return z.record(
    z.string().transform(Number).pipe(chainIdSchema),
    z.object({
      id: chainIdSchema,
      block: blockRefSchema,
    }),
    {
      error: "Ponder Status must be an object mapping valid chain name to a chain status object.",
    },
  );
};

/**
 * Fetch Status for requested Ponder instance.
 */
export async function fetchPonderStatus(ponderAppUrl: URL): Promise<PonderStatus> {
  const ponderStatusUrl = new URL("/status", ponderAppUrl);

  try {
    const statusResponse = await fetch(ponderStatusUrl).then((r) => r.json());
    const parsed = makePonderStatusSchema().safeParse(statusResponse);

    if (parsed.error) {
      throw new Error(`Cannot deserialize BlockRef:\n${prettifyError(parsed.error)}\n`);
    }

    return parsed.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new Error(
      `Could not fetch Ponder status from '${ponderStatusUrl}' due to: ${errorMessage}`,
    );
  }
}
