import type { AccountId, NormalizedAddress } from "enssdk";

import type { IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import type { LogEventBase } from "@/lib/ponder-helpers";

/**
 * Retrieves the AccountId representing the contract on this chain under which `event` was emitted.
 *
 * @example
 * const { chainId, address } = getThisAccountId(context, event);
 */
export const getThisAccountId = (
  context: IndexingEngineContext,
  event: Pick<LogEventBase, "log">,
) =>
  ({
    chainId: context.chain.id,
    // Ponder provides us a NormalizedAddress, cast here to avoid the minor overhead of (as|to)NormalizedAddress
    address: event.log.address as NormalizedAddress,
  }) satisfies AccountId;
