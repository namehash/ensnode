import { cva } from "class-variance-authority";

export const namekitButtonVariants = cva(
  "nhui:relative nhui:transition nhui:text-base nhui:rounded-lg nhui:border nhui:font-medium nhui:inline-flex nhui:gap-2 nhui:items-center nhui:whitespace-nowrap nhui:underline-none disabled:nhui:opacity-50",
  {
    variants: {
      variant: {
        primary: "nhui:bg-black nhui:text-white nhui:border-black hover:nhui:bg-[#272727]",
        secondary:
          "nhui:bg-white nhui:text-black nhui:border-alto nhui:shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:nhui:bg-gray-50",
        ghost: "nhui:text-black nhui:border-transparent hover:nhui:bg-black/5",
      },
      size: {
        small: "nhui:py-1 nhui:px-2 nhui:text-sm",
        medium: "nhui:py-2 nhui:px-4",
        large: "nhui:py-3 nhui:px-6 nhui:text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  },
);
