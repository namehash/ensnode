import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type * as React from "react";

import { cn } from "../../utils/cn";

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "nhui:relative nhui:flex nhui:size-8 nhui:shrink-0 nhui:overflow-hidden nhui:rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("nhui:aspect-square nhui:size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "nhui:bg-muted nhui:flex nhui:size-full nhui:items-center nhui:justify-center nhui:rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
