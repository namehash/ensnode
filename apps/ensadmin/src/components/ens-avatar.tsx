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

interface EnsAvatarDisplayProps {
  name: Name;
  avatarUrl: URL | null;
  className?: string;
}

type ImageLoadingStatus = Parameters<
  NonNullable<React.ComponentProps<typeof AvatarImage>["onLoadingStatusChange"]>
>[0];

/**
 * Display component that renders an avatar with proper loading and fallback states.
 * This is a pure presentational component that doesn't fetch data.
 *
 * This component handles three distinct states:
 * 1. **Loading**: Shows a pulsing placeholder while loading the avatar image asset
 * 2. **Avatar Loaded**: Displays the avatar image once loaded
 * 3. **Fallback**: Shows a generated avatar based on the ENS name when no avatar URL is provided
 *    or if the avatar image fails to load.
 *
 * The component ensures that the fallback avatar is only shown as a final state, never during loading,
 * preventing unwanted visual transitions from fallback to actual avatar.
 *
 * @param name - The ENS name (used for fallback avatar generation)
 * @param avatarUrl - The avatar URL to display, or null to show fallback
 * @param className - Optional CSS class name to apply to the avatar container
 *
 * @example
 * ```tsx
 * <EnsAvatarDisplay name="vitalik.eth" avatarUrl={new URL("https://...")} />
 * ```
 *
 * @example
 * ```tsx
 * <EnsAvatarDisplay name="example.eth" avatarUrl={null} className="h-12 w-12" />
 * ```
 */
export const EnsAvatarDisplay = ({ name, avatarUrl, className }: EnsAvatarDisplayProps) => {
  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<ImageLoadingStatus>("idle");

  // No avatar available - show fallback
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

/**
 * Displays an avatar for an ENS name with proper loading and fallback states.
 * This component fetches the avatar URL from ENS records and renders it.
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
export const EnsAvatar = ({ name, className }: EnsAvatarProps) => {
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

  const avatarUrl = avatarUrlData.browserSupportedAvatarUrl;

  return <EnsAvatarDisplay name={name} avatarUrl={avatarUrl} className={className} />;
};

interface EnsAvatarFallbackProps {
  name: Name;
}

const avatarFallbackColors = ["#000000", "#bedbff", "#5191c1", "#1e6495", "#0a4b75"];

const EnsAvatarFallback = ({ name }: EnsAvatarFallbackProps) => (
  <BoringAvatar name={name} colors={avatarFallbackColors} variant="beam" />
);

const AvatarLoading = () => <div className="h-full w-full rounded-full animate-pulse bg-muted" />;
