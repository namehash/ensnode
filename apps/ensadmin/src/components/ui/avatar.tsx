"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";
import fallbackImage from "../../assets/ensIcon.svg";

import { cn } from "@/lib/utils";
import {ENSNamespaceId, getEnsNameAvatarUrl} from "@ensnode/datasources";

interface AvatarProps {
    namespaceId: ENSNamespaceId;
    name?: string;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & AvatarProps
>(({ className, namespaceId, name, ...props }, ref) => {
    // Get ENS avatar URL
    const ensAvatarUrl = name ? getEnsNameAvatarUrl(namespaceId, name) : null;
    const handleAvatarImageFetchFailure = (event: React.SyntheticEvent<HTMLImageElement>) => {
        //TODO: Is such fallback idea alright? Or should we aim to display AvatarFallback no matter what error we encounter?
        // Or maybe the image could be something more appropriate?
        event.currentTarget.src = fallbackImage.src;
    }
    return (
        <AvatarPrimitive.Root
            ref={ref}
            className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
            {...props}
        >
            {ensAvatarUrl ? <AvatarImage src={ensAvatarUrl.toString()} alt={name!} onError={handleAvatarImageFetchFailure} /> : <AvatarFallback />}
        </AvatarPrimitive.Root>
    );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
    HTMLImageElement,
    React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt, onError, ...props }, ref) => (
    <img
        ref={ref}
        className={cn("aspect-square h-full w-full", className)}
        onError={onError}
        alt={alt}
        {...props}
    />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
