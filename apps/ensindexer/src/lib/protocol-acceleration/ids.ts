import { ChainId, CoinType, Node, coinTypeReverseLabel } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

/**
 * Makes a unique ID for any resolver record entity that is keyed beyond Node
 * (i.e. text, address records).
 *
 * See comment in packages/ensnode-schema/src/subgraph.schema.ts for additional context.
 *
 * @example
 * ```ts
 * // For address records in a Resolver, use coinType as key
 * makeKeyedResolverRecordId(resolverId, coinType.toString())
 * // => "0x123...-60" // for ETH (coinType 60)
 *
 * // For text records in a Resolver, use the text key
 * makeKeyedResolverRecordId(resolverId, "avatar")
 * // => "0x123...-avatar"
 * ```
 *
 * @param resolverId the id of the resolver entity
 * @param key the unique id of the resolver record within a resolverId
 * @returns a unique resolver record entity id
 */
export const makeKeyedResolverRecordId = (resolverId: string, key: string) =>
  [resolverId, key].join("-");

/**
 * Makes a unique ID for a Node<->Resolver relation on a given chain. NodeResolverRelations are
 * unique by (chainId, node).
 *
 * @see packages/ensnode-schema/src/protocol-acceleration.schema.ts
 *
 * @example `${chainId}-${node}`
 *
 * @param chainId the chain ID
 * @param node the Node
 * @returns a unique Node-Resolver relation ID
 */
export const makeNodeResolverRelationId = (chainId: ChainId, node: Node) =>
  [chainId, node].join("-");

/**
 * Makes a unique ID for a primary name record, keyed by (address, coinType).
 *
 * @param address the address for which the primary name is set
 * @param coinType the coin type
 * @returns a unique primary name id
 */
export const makePrimaryNameId = (address: Address, coinType: CoinType) =>
  [address, coinTypeReverseLabel(coinType)].join("-");

/**
 * Makes a unique Resolver Records ID.
 *
 * @example `${chainId}-${address}-${node}`
 *
 * @param chainId the chain ID
 * @param address the resolver contract address
 * @param node the ENS Node
 * @returns a unique Resolver Records ID
 */

export const makeResolverRecordsId = (chainId: number, address: Address, node: Node) =>
  [chainId, address, node].join("-");
