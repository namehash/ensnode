import type { Address } from "viem";
import { getAddress } from "viem";

interface AddressDisplayProps {
  address: Address;
  className?: string;
}

/**
 * Displays a truncated checksummed address without any navigation.
 * Pure display component for showing addresses.
 */
export function AddressDisplay({ address, className }: AddressDisplayProps) {
  const checksummedAddress = getAddress(address);
  const truncatedAddress = `${checksummedAddress.slice(0, 6)}...${checksummedAddress.slice(-4)}`;
  return <span className={className}>{truncatedAddress}</span>;
}
