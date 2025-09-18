"use client";

import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { Name } from "@ensnode/ensnode-sdk";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import BoringAvatar from "boring-avatars";
import * as React from "react";

interface AvatarProps {
  ensName: Name;
  namespaceId: ENSNamespaceId;
}

type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error";

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & AvatarProps
>(({ ensName, namespaceId, className, ...props }, ref) => {
  const [loadingStatus, setLoadingStatus] = React.useState<ImageLoadingStatus>("idle");
  const ensAvatarUrl = ensName ? getNameAvatarUrl(ensName, namespaceId) : null;
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    >
      {ensAvatarUrl && (
        <AvatarImage
          src={ensAvatarUrl.href}
          alt={ensName}
          onLoadingStatusChangeCallback={(status: ImageLoadingStatus) => {
            setLoadingStatus(status);
          }}
        />
      )}
      {ensAvatarUrl === null || loadingStatus === "error" ? (
        <AvatarFallback name={ensName} />
      ) : (
        (loadingStatus === "idle" || loadingStatus === "loading") && <AvatarLoading />
      )}
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

interface AvatarImageProps {
  onLoadingStatusChangeCallback: (status: ImageLoadingStatus) => void;
}

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement> & AvatarImageProps
>(({ className, onLoadingStatusChangeCallback, onError, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    onLoadingStatusChange={onLoadingStatusChangeCallback}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

interface AvatarFallbackProps {
  name: Name;
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & AvatarFallbackProps
>(({ className, name, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  >
    <BoringAvatar
      name={name}
      colors={["#000000", "#bedbff", "#5191c1", "#1e6495", "#0a4b75"]}
      variant="beam"
    />
  </AvatarPrimitive.Fallback>
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const AvatarLoading = () => <div className="h-6 w-6 rounded-full animate-pulse bg-muted" />;
