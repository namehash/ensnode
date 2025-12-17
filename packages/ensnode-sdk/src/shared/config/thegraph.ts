import { z } from "zod/v4";

/**
 * Reasons why TheGraph fallback cannot be used.
 */
export const TheGraphCannotFallbackReasonSchema = z.enum({
  NotSubgraphCompatible: "not-subgraph-compatible",
  NoApiKey: "no-api-key",
  NoSubgraphUrl: "no-subgraph-url",
});

export type TheGraphCannotFallbackReason = z.infer<typeof TheGraphCannotFallbackReasonSchema>;

/**
 * Configuration for TheGraph fallback behavior.
 * Indicates whether fallback to TheGraph is possible and the reason if not.
 */
export const TheGraphFallbackSchema = z.strictObject({
  canFallback: z.boolean(),
  reason: TheGraphCannotFallbackReasonSchema.nullable(),
});

export type TheGraphFallback = z.infer<typeof TheGraphFallbackSchema>;
