import { cva } from "class-variance-authority";

export const legacyButtonVariants = cva(
  "nhui:relative nhui:transition nhui:text-base nhui:rounded-md nhui:border nhui:font-medium nhui:inline-flex nhui:gap-2 nhui:items-center nhui:whitespace-nowrap nhui:no-underline nhui:disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "nhui:bg-black nhui:text-white nhui:border-black nhui:hover:bg-[#272727]",
        secondary:
          "nhui:bg-white nhui:text-black nhui:border-[#DBDBDB] nhui:shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] nhui:hover:bg-gray-50",
        ghost: "nhui:text-black nhui:border-transparent nhui:hover:bg-black/5",
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
