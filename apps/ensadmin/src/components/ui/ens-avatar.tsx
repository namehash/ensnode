"use client";

import { buildEnsMetadataServiceAvatarUrl } from "@/lib/namespace-utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { Name } from "@ensnode/ensnode-sdk";
import BoringAvatar from "boring-avatars";
import * as React from "react";
import {Avatar, AvatarImage} from "@/components/shadcn/avatar";

interface EnsAvatarProps {
  ensName: Name;
  namespaceId: ENSNamespaceId;
  className?: string;
}

type ImageLoadingStatus = Parameters<React.ComponentProps<typeof AvatarImage>["onLoadingStatusChange"]>[0];

const avatarFallbackColors = ["#000000", "#bedbff", "#5191c1", "#1e6495", "#0a4b75"];

export const EnsAvatar = ({ ensName, namespaceId, className }: EnsAvatarProps) => {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>("idle");
  const ensAvatarUrl = ensName ? buildEnsMetadataServiceAvatarUrl(ensName, namespaceId) : null;

  if (ensAvatarUrl === null) {
    return (
      <Avatar
        className={className}
      >
        <EnsAvatarFallback name={ensName} />
      </Avatar>
    );
  }

  return (
    <Avatar
      className={className}
    >
      <AvatarImage
        src={ensAvatarUrl.href}
        alt={ensName}
        onLoadingStatusChange={(status: ImageLoadingStatus) => {
          setLoadingStatus(status);
        }}
      />
      {loadingStatus === "error" && <EnsAvatarFallback name={ensName} />}
      {(loadingStatus === "idle" || loadingStatus === "loading") && <AvatarLoading />}
    </Avatar>
  );
};


interface EnsAvatarFallbackProps {
  name: Name;
}

const EnsAvatarFallback = ({name}: EnsAvatarFallbackProps) =>
    <BoringAvatar
      name={name}
      colors={avatarFallbackColors}
      variant="beam"
    />;

const AvatarLoading = () => <div className="h-6 w-6 rounded-full animate-pulse bg-muted" />;
