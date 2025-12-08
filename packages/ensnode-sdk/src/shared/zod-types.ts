import type { z } from "zod/v4";

/**
 * Zod `.check()` function input.
 */
export type ZodCheckFnInput<T> = z.core.ParsePayload<T>;
