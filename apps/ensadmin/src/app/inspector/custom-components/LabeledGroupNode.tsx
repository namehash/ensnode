import { cn } from "@/lib/utils";
import { NodeProps, Panel, PanelPosition } from "@xyflow/react";
import React, { forwardRef, HTMLAttributes, memo, ReactNode } from "react";
import { BaseNode } from "./BaseNode";

/* GROUP NODE Label ------------------------------------------------------- */

export type GroupNodeLabelProps = HTMLAttributes<HTMLDivElement>;

export const GroupNodeLabel = forwardRef<HTMLDivElement, GroupNodeLabelProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className="h-full w-full" {...props}>
        <div
          className={cn("w-fit p-2 font-bold text-xs text-center text-card-foreground", className)}
        >
          {children}
        </div>
      </div>
    );
  },
);

GroupNodeLabel.displayName = "GroupNodeLabel";

export type GroupNodeProps = Partial<NodeProps> & {
  label?: ReactNode | string;
  position?: PanelPosition;
};

/* GROUP NODE -------------------------------------------------------------- */

export const GroupNode = forwardRef<HTMLDivElement, GroupNodeProps>(
  ({ selected, label, position, ...props }, ref) => {
    const getLabelClassName = (position?: PanelPosition) => {
      switch (position) {
        case "top-left":
          return "rounded-br-sm";
        case "top-center":
          return "rounded-b-sm";
        case "top-right":
          return "rounded-bl-sm";
        case "bottom-left":
          return "rounded-tr-sm";
        case "bottom-right":
          return "rounded-tl-sm";
        case "bottom-center":
          return "rounded-t-sm";
        default:
          return "rounded-br-sm";
      }
    };

    return (
      <BaseNode
        ref={ref}
        selected={selected}
        className="h-full overflow-hidden rounded-sm bg-white bg-opacity-50 p-0"
        {...props}
      >
        <Panel
          className="p-0 h-full"
          style={{ margin: "0", writingMode: "sideways-lr", textOrientation: "mixed" }}
        >
          {label && <GroupNodeLabel>{label}</GroupNodeLabel>}
        </Panel>
      </BaseNode>
    );
  },
);

GroupNode.displayName = "GroupNode";

export const LabeledGroupNode = memo(({ selected, data }: NodeProps) => {
  return <GroupNode position="top-left" selected={selected} label={data.label as string} />;
});
