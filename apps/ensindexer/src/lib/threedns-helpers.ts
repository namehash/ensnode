import { hexToBigInt } from "viem";

import { TokenId } from "@/lib/tokenscope/assets";
import { Node } from "@ensnode/ensnode-sdk";

/**
 * ThreeDNSToken's tokenId is the bigint representation of a Domain's Node
 */
export const getThreeDNSTokenId = (node: Node): TokenId => hexToBigInt(node, { size: 32 });
