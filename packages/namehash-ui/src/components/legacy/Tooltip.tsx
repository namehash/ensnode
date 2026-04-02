import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { useState } from "react";

import { cn } from "../../utils/cn";

type Props = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  maxTooltipWidth?: number;
  className?: string;
  withDelay?: boolean;
} & Omit<
  React.ComponentProps<typeof TooltipPrimitive.Content>,
  "children" | "side" | "style" | "className"
>;

export const DEFAULT_MAX_TOOLTIP_WIDTH = 400;

export const TooltipPlacement = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
} as const;

export type TooltipPlacement = (typeof TooltipPlacement)[keyof typeof TooltipPlacement];

export const DEFAULT_TOOLTIP_PLACEMENT = TooltipPlacement.Top;

export function Tooltip({
  trigger,
  children,
  placement = DEFAULT_TOOLTIP_PLACEMENT,
  maxTooltipWidth = DEFAULT_MAX_TOOLTIP_WIDTH,
  className,
  withDelay = false,
  sideOffset = 15,
  collisionPadding = 6,
  avoidCollisions = true,
  ...props
}: Props) {
  const triggerNode =
    React.isValidElement(trigger) && trigger.type !== React.Fragment ? (
      trigger
    ) : (
      <span>{trigger}</span>
    );
  const [open, setOpen] = useState(false);

  return (
    <TooltipPrimitive.Provider delayDuration={withDelay ? 300 : 0}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <div className={cn("nhui:flex nhui:items-center", className)}>
          <TooltipPrimitive.Trigger onClick={() => setOpen(true)} asChild>
            {triggerNode}
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side={placement}
              sideOffset={sideOffset}
              collisionPadding={collisionPadding}
              avoidCollisions={avoidCollisions}
              className={cn(
                "nhui:z-50 nhui:rounded-md nhui:bg-black nhui:outline-none",
                "nhui:origin-(--radix-tooltip-content-transform-origin)",
                "nhui:transition-opacity nhui:duration-300",
                "nhui:data-[state=delayed-open]:animate-in nhui:data-[state=closed]:animate-out",
                "nhui:data-[state=closed]:duration-200",
                "nhui:data-[state=closed]:fade-out-0 nhui:data-[state=delayed-open]:fade-in-0",
                "nhui:data-[side=top]:slide-in-from-bottom-1",
                "nhui:data-[side=right]:slide-in-from-left-1",
                "nhui:data-[side=bottom]:slide-in-from-top-1",
                "nhui:data-[side=left]:slide-in-from-right-1",
              )}
              style={{ maxWidth: maxTooltipWidth }}
              {...props}
            >
              <TooltipPrimitive.Arrow className="nhui:z-50 nhui:size-2.5 nhui:translate-y-[calc(-50%_-_2px)] nhui:rotate-45 nhui:rounded-[2px] nhui:bg-black nhui:fill-black" />
              <div className="nhui:relative nhui:z-10 nhui:h-full nhui:rounded-md nhui:px-4 nhui:py-2 nhui:text-sm nhui:font-medium nhui:text-white">
                {children}
              </div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </div>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
