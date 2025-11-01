import type { Event } from "ponder:registry";

import type { ChainId, EventRef, RegistrarEventName } from "@ensnode/ensnode-sdk";

/**
 * Build an {@link EventRef} object for a Ponder {@link Event} indexed on
 * {@link ChainId} under a specific {@link RegistrarEventName}.
 */
export function buildEventRef<const RegistrarEventNameType extends RegistrarEventName>(
  event: Event & { chainId: ChainId; name: RegistrarEventNameType },
): EventRef<RegistrarEventNameType> {
  return {
    id: event.id,
    name: event.name,
    chainId: event.chainId,
    block: {
      number: Number(event.block.number),
      timestamp: Number(event.block.timestamp),
    },
    contractAddress: event.log.address,
    transactionHash: event.transaction.hash,
    logIndex: event.log.logIndex,
  };
}
