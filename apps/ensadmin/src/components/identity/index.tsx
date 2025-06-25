"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportedChainId } from "@/lib/wagmi";
import { cx } from "class-variance-authority";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useEnsName } from "wagmi";

//TODO: add descriptions for other fields
//TODO: the tyoe might change after deciding where to handle possibly undefined values for ens URLs
interface IdentityProps {
  address: Address;
  chainId: SupportedChainId; //TODO: We need to be more precise here. We shouldn't be passing in any possible supported chain Id (for example, we "support" optimism, base, etc..).
  // Instead, more specifically this should be the ENS Deployment Chain Id for the connected ENSNode instance.
  /**
   * ENS related values
   */
  ens: {
    /** ENS Web application base URL */
    appBaseUrl: URL | undefined;
    /** ENS metadata base URL */
    metadataBaseUrl: URL | undefined;
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
  chainId,
  ens,
  showAvatar = false,
  showExternalLink = true,
  className = "",
}: IdentityProps) {
  const [mounted, setMounted] = useState(false);

  // Use the ENS name hook from wagmi
  const {
    data: ensName,
    isLoading,
    isError,
  } = useEnsName({
    address,
    chainId,
  });
  //TODO: if the ENS deployment chain is the ens-test-env, we should not make use of the useEnsName hook at all and instead just always show the truncated address and not look up the primary name.
  // We should document that we'll need to come back to this later after introducing a mechanism for ENSNode to optionally pass an RPC endpoint ENSAdmin for it to make lookups such as this.

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  // If not mounted yet (server-side), or still loading, show a skeleton
  if (!mounted || isLoading) {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error, show the truncated address
  if (isError) {
    return <span className="font-mono text-xs">{truncatedAddress}</span>;
  }

  // Get ENS app Name Preview URL
  const ensAppNamePreviewUrl =
    ens.appBaseUrl && ensName ? new URL(ensName, ens.appBaseUrl) : undefined;

  // Get ENS avatar URL
  const ensAvatarUrl =
    ens.metadataBaseUrl && ensName ? new URL(ensName, ens.metadataBaseUrl) : undefined;

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
