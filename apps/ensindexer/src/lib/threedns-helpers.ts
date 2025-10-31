import { hexToBigInt } from "viem";

import type { Node } from "@ensnode/ensnode-sdk";

import type { TokenId } from "@/lib/tokenscope/assets";

/**
 * ThreeDNSToken's tokenId is the bigint representation of a Domain's Node
 */
export const getThreeDNSTokenId = (node: Node): TokenId => hexToBigInt(node, { size: 32 });
