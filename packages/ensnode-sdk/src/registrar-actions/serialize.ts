import { serializePrice } from "../shared";
import type { SerializedRegistrarAction } from "./serialized-types";
import type { RegistrarAction } from "./types";

export function serializeRegistrarAction(
  registrarAction: RegistrarAction,
): SerializedRegistrarAction {
  return {
    type: registrarAction.type,
    node: registrarAction.node,
    baseCost: serializePrice(registrarAction.baseCost),
    premium: serializePrice(registrarAction.premium),
    total: serializePrice(registrarAction.total),
    rawReferrer: registrarAction.rawReferrer,
    interpretedReferrer: registrarAction.interpretedReferrer,
    registrant: registrarAction.registrant,
    blockTimestamp: registrarAction.blockTimestamp,
    chainId: registrarAction.chainId,
    transactionHash: registrarAction.transactionHash,
  };
}
