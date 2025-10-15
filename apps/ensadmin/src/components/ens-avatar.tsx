"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAvatarUrl } from "@ensnode/ensnode-react";
import { ENSNamespaceId, Name } from "@ensnode/ensnode-sdk";
import BoringAvatar from "boring-avatars";
import * as React from "react";

interface EnsAvatarProps {
  name: Name;
  namespaceId: ENSNamespaceId;
  className?: string;
}

type ImageLoadingStatus = Parameters<
  NonNullable<React.ComponentProps<typeof AvatarImage>["onLoadingStatusChange"]>
>[0];

/**
 * Displays an avatar for an ENS name with proper loading and fallback states.
 *
 * This component handles three distinct states:
 * 1. **Loading**: Shows a pulsing placeholder while fetching the avatar URL from ENS records
 *    and while loading the avatar image asset itself
 * 2. **Avatar Loaded**: Displays the avatar image once loaded
 * 3. **Fallback**: Shows a generated avatar based on the ENS name when no avatar record is set for `name`,
 *    or the avatar record set for `name` is not formatted as a proper url, or if no browser-supported url
 *    was available, or if the browser-supported url for the avatar failed to load.
 *
 * The component ensures that the fallback avatar is only shown as a final state, never during loading,
 * preventing unwanted visual transitions from fallback to actual avatar.
 *
 * @param name - The ENS name to display an avatar for
 * @param className - Optional CSS class name to apply to the avatar container
 *
 * @example
 * ```tsx
 * <EnsAvatar name="vitalik.eth" />
 * ```
 *
 * @example
 * ```tsx
 * <EnsAvatar name="example.eth" className="h-12 w-12" />
 * ```
 */
export const EnsAvatar = ({ name, namespaceId, className }: EnsAvatarProps) => {
  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<ImageLoadingStatus>("idle");

  const { data: avatarUrlData, isLoading: isAvatarUrlLoading } = useAvatarUrl({
    name,
  });

  // Show loading state while fetching avatar URL or if data is not yet available
  if (isAvatarUrlLoading || !avatarUrlData) {
    return (
      <Avatar className={className}>
        <AvatarLoading />
      </Avatar>
    );
  }

  // No avatar available - show fallback
  if (avatarUrlData.browserSupportedAvatarUrl === null) {
    return (
      <Avatar className={className}>
        <EnsAvatarFallback name={name} />
      </Avatar>
    );
  }

  const avatarUrl = avatarUrlData.browserSupportedAvatarUrl;

  return (
    <Avatar className={className}>
      <AvatarImage
        src={avatarUrl.toString()}
        alt={name}
        onLoadingStatusChange={(status: ImageLoadingStatus) => {
          setImageLoadingStatus(status);
        }}
      />
      {imageLoadingStatus === "error" && <EnsAvatarFallback name={name} />}
      {(imageLoadingStatus === "idle" || imageLoadingStatus === "loading") && <AvatarLoading />}
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
