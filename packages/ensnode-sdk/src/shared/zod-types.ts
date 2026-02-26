import type { z } from "zod/v4";

/**
 * Zod `.check()` function input.
 */
export type ZodCheckFnInput<T> = z.core.ParsePayload<T>;

/**
 * Adds additional JSON Schema properties to a zod schema via the `.openapi()`
 * extension provided by `@asteasolutions/zod-to-openapi`. The prototype method
 * is available at runtime when `@hono/zod-openapi` is imported (which patches
 * `ZodType.prototype`), but is not reflected in the `zod/v4` types — hence the
 * cast.
 */
export const withOpenApi = <T extends z.ZodType>(schema: T, metadata: Record<string, unknown>): T =>
  (schema as any).openapi(metadata);
