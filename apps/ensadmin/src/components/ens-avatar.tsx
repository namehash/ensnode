"use client";

import BoringAvatar from "boring-avatars";
import * as React from "react";

import type { ENSNamespaceId } from "@ensnode/datasources";
import type { Name } from "@ensnode/ensnode-sdk";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { buildEnsMetadataServiceAvatarUrl } from "@/lib/namespace-utils";

interface EnsAvatarProps {
  name: Name;
  namespaceId: ENSNamespaceId;
  className?: string;
}

type ImageLoadingStatus = Parameters<
  NonNullable<React.ComponentProps<typeof AvatarImage>["onLoadingStatusChange"]>
>[0];

export const EnsAvatar = ({ name, namespaceId, className }: EnsAvatarProps) => {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>("idle");
  const avatarUrl = buildEnsMetadataServiceAvatarUrl(name, namespaceId);

  if (avatarUrl === null) {
    return (
      <Avatar className={className}>
        <EnsAvatarFallback name={name} />
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
      {loadingStatus === "error" && <EnsAvatarFallback name={name} />}
      {(loadingStatus === "idle" || loadingStatus === "loading") && <AvatarLoading />}
    </Avatar>
  );
};

interface EnsAvatarFallbackProps {
  name: Name;
}

const avatarFallbackColors = ["#000000", "#bedbff", "#5191c1", "#1e6495", "#0a4b75"];

const EnsAvatarFallback = ({ name }: EnsAvatarFallbackProps) => (
  <BoringAvatar name={name} colors={avatarFallbackColors} variant="beam" />
);

const AvatarLoading = () => <div className="h-full w-full rounded-full animate-pulse bg-muted" />;
