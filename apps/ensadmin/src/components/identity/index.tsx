"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportedChainId } from "@/lib/wagmi";
import { cx } from "class-variance-authority";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { UseEnsNameReturnType } from "wagmi";
import { GetEnsNameData } from "@wagmi/core/query";

//TODO: add descriptions for other fields
//TODO: the type might change after deciding where to handle possibly undefined values for ens URLs -> for now the <RegistrationRow /> & <RegistrationNameDisplay /> components handle the possibly undefined values
interface IdentityProps {
  address: Address;
  /**
   * ENS related values
   */
  ens: {
    /** ENS Web application base URL */
    appBaseUrl: URL;
    /** ENS metadata base URL */
    metadataBaseUrl: URL;
    /** ENS name query object */
    nameQuery: UseEnsNameReturnType<GetEnsNameData>;
  };
  showAvatar?: boolean;
  showExternalLink?: boolean;
  className?: string;
}

/**
 * Component to display an ENS name for an Ethereum address.
 * It can display an avatar if available, a link to the ENS name, or a truncated address.
 */
export function Identity({
  address,
  ens,
  showAvatar = false,
  showExternalLink = true,
  className = "",
}: IdentityProps) {
  const [mounted, setMounted] = useState(false);


  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  // If not mounted yet (server-side), or still loading, show a skeleton
  if (!mounted || ens.nameQuery.isLoading) {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error, show the truncated address
  if (ens.nameQuery.isError) {
    return <span className="font-mono text-xs">{truncatedAddress}</span>;
  }

  const ensName = ens.nameQuery.data;

  // Get ENS app Name Preview URL
  const ensAppNamePreviewUrl = ensName ? new URL(ensName, ens.appBaseUrl) : undefined;

  // Get ENS avatar URL
  const ensAvatarUrl = ensName ? new URL(ensName, ens.metadataBaseUrl) : undefined;

  // Display name (ENS name or truncated address)
  const displayName = ensName || truncatedAddress;

  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && (
        <Avatar className="h-6 w-6">
          {ensAvatarUrl && ensName && <AvatarImage src={ensAvatarUrl.toString()} alt={ensName} />}
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {/*TODO: previously we linked to owners even if they didn't have a primary name set, should we keep doing it?*/}
      {ensAppNamePreviewUrl ? (
        <a
          href={ensAppNamePreviewUrl.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:underline"
          title={address}
        >
          <span className={ensName ? "font-medium" : "font-mono text-xs"}>{displayName}</span>
          {showExternalLink && <ExternalLink size={14} className="inline-block" />}
        </a>
      ) : (
        <span className={ensName ? "font-medium" : "font-mono text-xs"}>{displayName}</span>
      )}
    </div>
  );
}
Identity.Placeholder = IdentityPlaceholder;

interface IdentityPlaceholderProps extends Pick<IdentityProps, "showAvatar" | "className"> {}

function IdentityPlaceholder({ showAvatar = false, className = "" }: IdentityPlaceholderProps) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && <Skeleton className="h-6 w-6 rounded-full" />}
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
