"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportedChainId } from "@/lib/wagmi";
import { cx } from "class-variance-authority";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useEnsName } from "wagmi";

interface ENSNameProps {
  address: Address;
  chainId: SupportedChainId;
  showAvatar?: boolean;
  showExternalLink?: boolean;
  className?: string;
}

/**
 * Component to display an ENS name for an Ethereum address.
 * Falls back to a truncated address if no ENS name is found.
 */
export function ENSName({
  address,
  chainId,
  showAvatar = false,
  showExternalLink = true,
  className = "",
}: ENSNameProps) {
  const [mounted, setMounted] = useState(false);

  // Use the ENS name hook from wagmi
  const { data: ensName, isLoading } = useEnsName({
    address,
    chainId,
  });

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate ENS app URL
  const ensAppUrl = `https://app.ens.domains/${address}`;

  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Display name (ENS name or truncated address)
  const displayName = ensName || truncatedAddress;

  // If not mounted yet (server-side), show a skeleton
  if (!mounted) {
    return <EnsNamePlaceholder showAvatar={showAvatar} className={className} />;
  }

  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && (
        <Avatar className="h-6 w-6">
          {ensName && (
            <AvatarImage
              src={`https://metadata.ens.domains/mainnet/avatar/${ensName}`}
              alt={ensName}
            />
          )}
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <a
        href={ensAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:underline"
        title={address}
      >
        <span className={ensName ? "font-medium" : "font-mono text-xs"}>
          {isLoading ? <Skeleton className="h-4 w-24" /> : displayName}
        </span>
        {showExternalLink && <ExternalLink size={14} className="inline-block" />}
      </a>
    </div>
  );
}
ENSName.Placeholder = EnsNamePlaceholder;

interface ENSNamePlaceholderProps extends Pick<ENSNameProps, "showAvatar" | "className"> {}

function EnsNamePlaceholder({ showAvatar = false, className = "" }: ENSNamePlaceholderProps) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && <Skeleton className="h-6 w-6 rounded-full" />}
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
