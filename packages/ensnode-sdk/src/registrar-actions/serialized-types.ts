import type { SerializedPrice } from "../shared";
import type {
  RegistrarAction,
  RegistrarActionWithRegistration,
  RegistrationWithNameDetails,
} from "./types";

/**
 * Serialized representation of {@link RegistrarAction}.
 */
export interface SerializedRegistrarAction
  extends Omit<RegistrarAction, "baseCost" | "premium" | "total"> {
  /**
   * Base cost
   */
  baseCost: SerializedPrice;

  /**
   * Premium
   */
  premium: SerializedPrice;

  /**
   * Total cost for performing the registrar action.
   *
   * Sum of `baseCost` and `premium`.
   */
  total: SerializedPrice;
}

/**
 * Serialized representation of {@link RegistrarActionWithRegistration}.
 */
export interface SerializedRegistrarActionWithRegistration extends SerializedRegistrarAction {
  registration: RegistrationWithNameDetails;
}
