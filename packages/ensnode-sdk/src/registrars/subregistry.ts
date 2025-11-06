import type { Node } from "../ens";
import type { AccountId } from "../shared";

/**
 * Subregistry
 */
export interface Subregistry {
  /**
   * Subregistry Account ID
   *
   * Identifies the account of the smart contract associated
   * with the subregistry.
   */
  subregistryId: AccountId;

  /**
   * The node (namehash) of the name the subregistry manages subnames of.
   * Example subregistry managed names:
   * - `eth`
   * - `base.eth`
   * - `linea.eth`
   */
  node: Node;
}
