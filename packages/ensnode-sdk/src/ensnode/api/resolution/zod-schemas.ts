import { z } from "zod/v4";

/**
 * Schema for resolver records response.
 *
 * NOTE: `version` and `abi.contentType` arrive over the wire as strings (server serializes
 * bigints via `replaceBigInts(response, String)` to avoid `JSON.stringify` throwing on bigint).
 * Callers that need these as `bigint` should `BigInt(...)` them.
 */
const makeResolverRecordsResponseSchema = () =>
  z.object({
    name: z.string().nullable().optional(),
    addresses: z.record(z.string(), z.string().nullable()).optional(),
    texts: z.record(z.string(), z.string().nullable()).optional(),
    contenthash: z.string().nullable().optional(),
    pubkey: z.object({ x: z.string(), y: z.string() }).nullable().optional(),
    dnszonehash: z.string().nullable().optional(),
    version: z.string().nullable().optional(),
    abi: z.object({ contentType: z.string(), data: z.string() }).nullable().optional(),
    interfaces: z.record(z.string(), z.string().nullable()).optional(),
  });

/**
 * Schema for {@link ResolveRecordsResponse}
 */
export const makeResolveRecordsResponseSchema = () =>
  z.object({
    records: makeResolverRecordsResponseSchema(),
    accelerationRequested: z.boolean(),
    accelerationAttempted: z.boolean(),
    // TODO: Find a better way to handle recursive types, patch solution is .unknown()
    trace: z.array(z.unknown()).optional(),
  });

/**
 * Schema for {@link ResolvePrimaryNameResponse}
 */
export const makeResolvePrimaryNameResponseSchema = () =>
  z.object({
    name: z.string().nullable(),
    accelerationRequested: z.boolean(),
    accelerationAttempted: z.boolean(),
    trace: z.array(z.unknown()).optional(),
  });

/**
 * Schema for {@link ResolvePrimaryNamesResponse}
 */
export const makeResolvePrimaryNamesResponseSchema = () =>
  z.object({
    names: z.record(z.number(), z.string().nullable()),
    accelerationRequested: z.boolean(),
    accelerationAttempted: z.boolean(),
    trace: z.array(z.unknown()).optional(),
  });
