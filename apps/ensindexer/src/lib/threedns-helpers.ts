import type { Node, TokenId } from "enssdk";
import { hexToBigInt } from "viem";

/**
 * ThreeDNSToken's tokenId is the bigint representation of a Domain's Node
 */
export const getThreeDNSTokenId = (node: Node): TokenId => hexToBigInt(node, { size: 32 });
