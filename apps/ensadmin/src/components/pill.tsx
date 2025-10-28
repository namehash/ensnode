import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PillProps extends ButtonProps {}

export const Pill = React.forwardRef<HTMLButtonElement, PillProps>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={cn("rounded-full", className)}
      {...props}
    />
  ),
);
Pill.displayName = "Pill";
