import { z } from "zod/v4";

import { withOpenApi } from "../../../shared/zod-types";

/**
 * Schema for resolver records response (addresses, texts, name)
 */
const makeResolverRecordsResponseSchema = () =>
  z.object({
    name: z.string().nullable().optional(),
    addresses: z.record(z.string(), z.string().nullable()).optional(),
    texts: z.record(z.string(), z.string().nullable()).optional(),
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
    names: withOpenApi(z.record(z.number(), z.string().nullable()), {
      propertyNames: { type: "string", pattern: "^[0-9]+$" },
    }),
    accelerationRequested: z.boolean(),
    accelerationAttempted: z.boolean(),
    trace: z.array(z.unknown()).optional(),
  });
