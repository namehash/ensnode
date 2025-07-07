"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import BoringAvatar from "boring-avatars";
import * as React from "react";

import { cn } from "@/lib/utils";
import { ENSNamespaceId, getNameAvatarUrl } from "@ensnode/datasources";
import { Address } from "viem";

interface AvatarProps {
  namespaceId: ENSNamespaceId;
  name?: string;
  address?: Address;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & AvatarProps
>(({ name, address, className, namespaceId, ...props }, ref) => {
  const ensAvatarUrl = name ? getNameAvatarUrl(name, namespaceId) : null;

  const fallbackValue = address?.toString() || name;

  // enforce that exactly 1 of address or name are passed, never both, never none.
  if (!fallbackValue || (name && address)) {
    throw new Error("The Avatar component needs exactly one of a name or address");
  }

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    >
      {ensAvatarUrl ? <AvatarImage src={ensAvatarUrl.toString()} alt={fallbackValue} /> : null}
      <AvatarFallback randomAvatarGenerationSeed={fallbackValue} />
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, onError, ...props }, ref) => (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  ),
);
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

interface AvatarFallbackProps {
  randomAvatarGenerationSeed: string;
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & AvatarFallbackProps
>(({ className, randomAvatarGenerationSeed, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  >
    <BoringAvatar
      name={randomAvatarGenerationSeed}
      colors={["#093c52", "#006699", "#0080bc", "#6ba5b8", "#9dc3d0"]}
      variant="marble"
    />
  </AvatarPrimitive.Fallback>
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
