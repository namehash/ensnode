import type { ChainId } from "@ensnode/ensnode-sdk";

import { getChainName } from "../../utils/chains";

export interface ChainNameProps {
  chainId: ChainId;
  className: string;
}

/**
 * Renders a prettified chain name for the provided {@link ChainId}.
 */
export const ChainName = ({ chainId, className }: ChainNameProps) => (
  <p className={className}>{getChainName(chainId)}</p>
);
