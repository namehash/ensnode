import type { Node } from "../ens";
import type { AccountId } from "../shared";

/**
 * Subregistry
 */
export interface Subregistry {
  /**
   * Subregistry Account ID
   */
  subregistryId: AccountId;

  /**
   *  The node of a name the subregistry manages. Example managed names:
   * - `eth`
   * - `base.eth`
   * - `linea.eth`
   */
  node: Node;
}
