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
export const TheGraphFallbackSchema = z.discriminatedUnion("canFallback", [
  z.strictObject({
    canFallback: z.literal(true),
    url: z.string(),
  }),
  z.strictObject({
    canFallback: z.literal(false),
    reason: TheGraphCannotFallbackReasonSchema,
  }),
]);

export type TheGraphFallback = z.infer<typeof TheGraphFallbackSchema>;
