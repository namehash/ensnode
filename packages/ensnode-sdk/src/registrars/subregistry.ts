import type { Node } from "../ens";
import type { AccountId } from "../shared";

/**
 * Subregistry
 */
export interface Subregistry {
  /**
   * Subregistry ID
   *
   * The ID of the subregistry the "logical registrar action" was taken on.
   *
   * Identifies the chainId and address of the associated subregistry smart
   * contract.
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
