"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import BoringAvatar from "boring-avatars";
import * as React from "react";

import { ChainIcon } from "@/components/chains/ChainIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getChainName } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";
import { ENSNamespaceId, getENSRootChainId } from "@ensnode/datasources";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
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

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  >
    {children}
  </AvatarPrimitive.Fallback>
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

interface NamedAddressFallbackProps {
  name: string;
}

const NamedAddressFallback = ({ name }: NamedAddressFallbackProps) => (
  <BoringAvatar
    name={name}
    colors={["#000000", "#ffffff", "#5191c1", "#1e6495", "#0a4b75"]}
    variant="beam"
  />
);

interface UnnamedAddressFallbackProps {
  namespaceId: ENSNamespaceId;
}

const UnnamedAddressFallback = ({ namespaceId }: UnnamedAddressFallbackProps) => {
  const chainId = getENSRootChainId(namespaceId);
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-default">
        <ChainIcon chainId={chainId} />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-gray-50 text-sm text-black text-center shadow-md outline-none w-fit"
      >
        {getChainName(chainId)}
      </TooltipContent>
    </Tooltip>
  );
};

export { Avatar, AvatarImage, AvatarFallback, NamedAddressFallback, UnnamedAddressFallback };
