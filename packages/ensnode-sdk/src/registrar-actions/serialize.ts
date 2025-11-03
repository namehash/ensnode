import { serializePrice } from "../shared";
import type {
  SerializedRegistrarAction,
  SerializedRegistrarActionWithRegistration,
} from "./serialized-types";
import type { RegistrarAction, RegistrarActionWithRegistration } from "./types";

export function serializeRegistrarAction(
  registrarAction: RegistrarAction,
): SerializedRegistrarAction {
  return {
    id: registrarAction.id,
    type: registrarAction.type,
    node: registrarAction.node,
    baseCost: serializePrice(registrarAction.baseCost),
    premium: serializePrice(registrarAction.premium),
    total: serializePrice(registrarAction.total),
    encodedReferrer: registrarAction.encodedReferrer,
    decodedReferrer: registrarAction.decodedReferrer,
    registrant: registrarAction.registrant,
    incrementalDuration: registrarAction.incrementalDuration,
    event: registrarAction.event,
  };
}

export function serializeRegistrarActionWithRegistration({
  registration,
  ...registrarAction
}: RegistrarActionWithRegistration): SerializedRegistrarActionWithRegistration {
  return {
    ...serializeRegistrarAction(registrarAction),

    registration,
  };
}
