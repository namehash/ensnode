import {getChainName} from "@ensnode/datasources";

export interface ChainNameProps {
  chainId: number;
  className: string;
}

/**
 * Renders a prettified chain name for the provided chain ID.
 */
export const ChainName = ({ chainId, className }: ChainNameProps) => (
  <p className={className}>{getChainName(chainId)}</p>
);
