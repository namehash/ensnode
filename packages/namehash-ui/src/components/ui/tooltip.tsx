import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type * as React from "react";

import { cn } from "../../utils/cn";

const TooltipArrow = TooltipPrimitive.Arrow;

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "nhui:bg-foreground nhui:text-background nhui:animate-in nhui:fade-in-0 nhui:zoom-in-95 nhui:data-[state=closed]:animate-out nhui:data-[state=closed]:fade-out-0 nhui:data-[state=closed]:zoom-out-95 nhui:data-[side=bottom]:slide-in-from-top-2 nhui:data-[side=left]:slide-in-from-right-2 nhui:data-[side=right]:slide-in-from-left-2 nhui:data-[side=top]:slide-in-from-bottom-2 nhui:z-50 nhui:w-fit nhui:origin-(--radix-tooltip-content-transform-origin) nhui:rounded-md nhui:px-3 nhui:py-1.5 nhui:text-xs nhui:text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="nhui:bg-foreground nhui:fill-foreground nhui:z-50 nhui:size-2.5 nhui:translate-y-[calc(-50%_-_2px)] nhui:rotate-45 nhui:rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow };
