import { Float } from "@headlessui-float/react";
import { Popover } from "@headlessui/react";
import cc from "classcat";
import React, { useState } from "react";

type Props = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  maxTooltipWidth?: number;
  className?: string;
  withDelay?: boolean;
};

export const DEFAULT_MAX_TOOLTIP_WIDTH = 400;

export const TooltipPlacement = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
} as const;

export type TooltipPlacement = (typeof TooltipPlacement)[keyof typeof TooltipPlacement];

export const DEFAULT_TOOLTIP_PLACEMENT = TooltipPlacement.Top;

export default function GenericTooltip({
  trigger,
  children,
  placement = DEFAULT_TOOLTIP_PLACEMENT,
  maxTooltipWidth = DEFAULT_MAX_TOOLTIP_WIDTH,
  className,
  withDelay = false,
  /*
                              Props are applied to the Float component,
                              which is a wrapper for the tooltip "children".
                            */
  ...props
}: Props) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Popover className={cc(["flex items-center z-[999]", className])}>
      <Float
        show={open}
        placement={placement} // our `TooltipPlacement` values are a subset of headlessui's `Placement` values
        offset={15}
        shift={6}
        flip={10}
        arrow
        // portal // removed due to Astro-related render issues
        enter={cc([
          "transition duration-300 ease-out",
          {
            "delay-300": withDelay,
          },
        ])}
        enterFrom="opacity-0 -translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition duration-200 ease-in delay-0"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-1"
        {...props}
      >
        <Popover.Group
          onClick={handleOpen}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          className="cursor-auto inline-flex items-center"
        >
          {trigger}
        </Popover.Group>

        <Popover.Panel
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          style={{ maxWidth: maxTooltipWidth }}
          className="rounded-md bg-black focus:outline-none"
        >
          <Float.Arrow className="absolute h-5 w-5 rotate-45 bg-black rounded-b" />
          <div className="relative h-full rounded-md text-sm font-medium text-white p-2">
            {children}
          </div>
        </Popover.Panel>
      </Float>
    </Popover>
  );
}
