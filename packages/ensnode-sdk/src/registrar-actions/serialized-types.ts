import type { SerializedPrice } from "../shared";
import type { RegistrarAction } from "./types";

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
   * Total cost of preforming the registrar action.
   *
   * Sum of `baseCost` and `premium`.
   */
  total: SerializedPrice;
}
