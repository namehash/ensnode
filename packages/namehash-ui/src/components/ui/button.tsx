import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "nhui:inline-flex nhui:items-center nhui:justify-center nhui:gap-2 nhui:whitespace-nowrap nhui:rounded-md nhui:text-sm nhui:font-medium nhui:transition-all nhui:disabled:pointer-events-none nhui:disabled:opacity-50 nhui:[&_svg]:pointer-events-none nhui:[&_svg:not([class*=size-])]:size-4 nhui:shrink-0 nhui:[&_svg]:shrink-0 nhui:outline-none nhui:focus-visible:border-ring nhui:focus-visible:ring-ring/50 nhui:focus-visible:ring-[3px] nhui:aria-invalid:ring-destructive/20 nhui:dark:aria-invalid:ring-destructive/40 nhui:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "nhui:bg-primary nhui:text-primary-foreground nhui:hover:bg-primary/90",
        destructive:
          "nhui:bg-destructive nhui:text-white nhui:hover:bg-destructive/90 nhui:focus-visible:ring-destructive/20 nhui:dark:focus-visible:ring-destructive/40 nhui:dark:bg-destructive/60",
        outline:
          "nhui:border nhui:bg-background nhui:shadow-xs nhui:hover:bg-accent nhui:hover:text-accent-foreground nhui:dark:bg-input/30 nhui:dark:border-input nhui:dark:hover:bg-input/50",
        secondary: "nhui:bg-secondary nhui:text-secondary-foreground nhui:hover:bg-secondary/80",
        ghost:
          "nhui:hover:bg-accent nhui:hover:text-accent-foreground nhui:dark:hover:bg-accent/50",
        link: "nhui:text-primary nhui:underline-offset-4 nhui:hover:underline",
      },
      size: {
        default: "nhui:h-9 nhui:px-4 nhui:py-2 nhui:has-[>svg]:px-3",
        sm: "nhui:h-8 nhui:rounded-md nhui:gap-1.5 nhui:px-3 nhui:has-[>svg]:px-2.5",
        lg: "nhui:h-10 nhui:rounded-md nhui:px-6 nhui:has-[>svg]:px-4",
        icon: "nhui:size-9",
        "icon-sm": "nhui:size-8",
        "icon-lg": "nhui:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
