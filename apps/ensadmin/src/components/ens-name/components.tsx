"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cx } from "class-variance-authority";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { Hex } from "viem";
import type { UseEnsNameReturnType } from "wagmi";
import type { GetEnsNameData } from "wagmi/query";
import { Registration } from "../recent-registrations/types";

interface ENSNameProps {
  address: Hex;

  /**
   * ENS related values
   */
  ens: {
    /** ENS Web application base URL */
    appBaseUrl: URL | undefined;
    /** ENS metadata base URL */
    metadataBaseUrl: URL | undefined;
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
export function ENSName({
  address,
  ens,
  showAvatar = false,
  showExternalLink = true,
  className = "",
}: ENSNameProps) {
  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const [mounted, setMounted] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet (server-side), or still loading, show a skeleton
  if (!mounted || ens.nameQuery.isLoading) {
    return <EnsNamePlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error, show the truncated address
  if (ens.nameQuery.isError) {
    return <span className="font-mono text-xs">{truncatedAddress}</span>;
  }

  const ensName = ens.nameQuery.data;

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
          {ensAvatarUrl && ensName ? (
            <AvatarImage src={ensAvatarUrl.toString()} alt={ensName} />
          ) : null}
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

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

interface ENSRegistrationProps {
  // NOTE: not every ENS deployment has an ENS app URL
  ensAppUrl: URL | undefined;

  registration: Registration;
}

/**
 * Component to display an ENS registration.
 * It can display a link to the ENS name, or a truncated address.
 */
export function ENSRegistration({ registration, ensAppUrl }: ENSRegistrationProps) {
  const ensAppRegistrationPreviewUrl = ensAppUrl
    ? new URL(registration.domain.name, ensAppUrl)
    : undefined;

  if (ensAppRegistrationPreviewUrl) {
    return (
      <a
        href={ensAppRegistrationPreviewUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:underline"
      >
        {registration.domain.name}
        <ExternalLink size={14} className="inline-block" />
      </a>
    );
  }

  return <span>{registration.domain.name}</span>;
}
