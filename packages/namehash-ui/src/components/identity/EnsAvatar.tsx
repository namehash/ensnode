import BoringAvatar from "boring-avatars";
import * as React from "react";

import type { ENSNamespaceId } from "@ensnode/datasources";
import type { Name } from "@ensnode/ensnode-sdk";

import { cn } from "../../utils/cn";
import { getEnsMetadataServiceAvatarUrl } from "../../utils/ensMetadata";
import { Avatar, AvatarImage } from "../ui/avatar";

interface EnsAvatarProps {
  name: Name;
  namespaceId: ENSNamespaceId;
  className?: string;
  isSquare?: boolean;
}

type ImageLoadingStatus = Parameters<
  NonNullable<React.ComponentProps<typeof AvatarImage>["onLoadingStatusChange"]>
>[0];

export const EnsAvatar = ({ name, namespaceId, className, isSquare = false }: EnsAvatarProps) => {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>("idle");
  const avatarUrl = getEnsMetadataServiceAvatarUrl(name, namespaceId);

  if (avatarUrl === null) {
    return (
      <Avatar className={className}>
        <EnsAvatarFallback name={name} isSquare={isSquare} />
      </Avatar>
    );
  }

  return (
    <Avatar className={className}>
      <AvatarImage
        src={avatarUrl.href}
        alt={name}
        onLoadingStatusChange={(status: ImageLoadingStatus) => {
          setLoadingStatus(status);
        }}
      />
      {loadingStatus === "error" && <EnsAvatarFallback name={name} isSquare={isSquare} />}
      {(loadingStatus === "idle" || loadingStatus === "loading") && (
        <AvatarLoading isSquare={isSquare} />
      )}
    </Avatar>
  );
};

interface EnsAvatarFallbackProps {
  name: Name;
  isSquare: boolean;
}

const avatarFallbackColors = ["#000000", "#bedbff", "#5191c1", "#1e6495", "#0a4b75"];

const EnsAvatarFallback = ({ name, isSquare }: EnsAvatarFallbackProps) => (
  <BoringAvatar
    name={name}
    colors={avatarFallbackColors}
    variant="beam"
    className="nhui:w-full nhui:h-full"
    square={isSquare}
  />
);

type EnsAvatarLoadingProps = Omit<EnsAvatarProps, "name" | "namespaceId" | "className">;
const AvatarLoading = ({ isSquare }: EnsAvatarLoadingProps) => (
  <div
    className={cn(
      "nhui:h-full nhui:w-full nhui:animate-pulse nhui:bg-gray-200",
      !isSquare && "nhui:rounded-full",
    )}
  />
);

// TODO: Copied from ENSAwards (as a newer version) - further alignment might be needed
