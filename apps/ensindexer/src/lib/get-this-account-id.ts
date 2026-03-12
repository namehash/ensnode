import type { Context } from "ponder:registry";

import type { AccountId } from "@ensnode/ensnode-sdk";

import type { LogEventBase } from "@/lib/ponder-helpers";

/**
 * Retrieves the AccountId representing the contract on this chain under which `event` was emitted.
 *
 * @example
 * const { chainId, address } = getThisAccountId(context, event);
 */
export const getThisAccountId = (context: Context, event: Pick<LogEventBase, "log">) =>
  ({ chainId: context.chain.id, address: event.log.address }) satisfies AccountId;
