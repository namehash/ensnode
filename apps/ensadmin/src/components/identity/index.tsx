"use client";

import {AddressDisplay, NameDisplay} from "@/components/recent-registrations/utils";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ENSNamespaceId,
  ENSNamespaceIds,
  getENSRootChainId,
} from "@ensnode/datasources";
import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useEnsName } from "wagmi";

//TODO: add descriptions for type's fields
interface IdentityProps {
  address: Address;
  namespaceId: ENSNamespaceId;
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
  namespaceId,
  showAvatar = false,
  showExternalLink = true,
  className = "",
}: IdentityProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  //TODO: if the ENS deployment chain is the ens-test-env, we should not make use of the useEnsName hook at all and instead just always show the truncated address and not look up the primary name.
  // We should document that we'll need to come back to this later after introducing a mechanism for ENSNode to optionally pass an RPC endpoint ENSAdmin for it to make lookups such as this.
  // is that an alright solution? - duplicates code with error of the query, but that seems necessary for our current predicament - allows us to avoid some additional if-ology when calling the wagmi hook
  if (namespaceId === ENSNamespaceIds.EnsTestEnv) {
    return <AddressDisplay namespaceId={namespaceId} address={address}/>;
  }

  const ensRootChainId = getENSRootChainId(namespaceId);

  // Use the ENS name hook from wagmi
  const {
    data: ensName,
    isLoading,
    isError,
  } = useEnsName({
    address,
    chainId: ensRootChainId,
  });

  // If not mounted yet (server-side), or still loading, show a skeleton
  if (!mounted || isLoading) {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error, show the address
  if (isError) {
    return <AddressDisplay namespaceId={namespaceId} address={address} showExternalLink={true} />;
  }

  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && <Avatar className="h-6 w-6" namespaceId={namespaceId} name={ensName} />}
      {ensName ? (
        <NameDisplay
          namespaceId={namespaceId}
          name={ensName}
          showExternalLink={showExternalLink}
        />
      ) : (
          <AddressDisplay namespaceId={namespaceId} address={address} showExternalLink={true}/>
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
