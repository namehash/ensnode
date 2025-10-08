"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAvatarUrl } from "@ensnode/ensnode-react";
import { Name } from "@ensnode/ensnode-sdk";
import BoringAvatar from "boring-avatars";
import * as React from "react";

interface EnsAvatarProps {
  name: Name;
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
 * 2. **Avatar Available**: Displays the avatar image once loaded, with an additional loading state for the image itself
 * 3. **Fallback**: Shows a generated avatar based on the ENS name when no avatar is available or if the image fails to load
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
export const EnsAvatar = ({ name, className }: EnsAvatarProps) => {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>("idle");

  const { data: avatarData, isLoading: isAvatarUrlLoading } = useAvatarUrl({
    name,
  });

  // Show loading state while fetching avatar URL
  if (isAvatarUrlLoading) {
    return (
      <Avatar className={className}>
        <AvatarLoading />
      </Avatar>
    );
  }

  // While useAvatarUrl has placeholderData, TanStack Query types data as possibly undefined
  // browserSupportedAvatarUrl is BrowserSupportedAssetUrl | null when present
  if (!avatarData || avatarData.browserSupportedAvatarUrl === null) {
    return (
      <Avatar className={className}>
        <EnsAvatarFallback name={name} />
      </Avatar>
    );
  }

  const avatarUrl = avatarData.browserSupportedAvatarUrl;

  return (
    <Avatar className={className}>
      <AvatarImage
        src={avatarUrl.toString()}
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
