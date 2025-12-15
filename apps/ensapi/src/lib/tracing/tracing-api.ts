import type { Trace } from "@ensnode/ensnode-sdk";

import { TracingContextManager } from "./tracing-context";

/**
 * Executes `fn`, capturing protocol-level tracing generated during execution.
 */
export async function runWithTrace<Fn extends () => Promise<any>>(
  fn: Fn,
): Promise<{ trace: Trace; result: Awaited<ReturnType<Fn>> }> {
  return TracingContextManager.getInstance().runWithTrace(fn);
}
