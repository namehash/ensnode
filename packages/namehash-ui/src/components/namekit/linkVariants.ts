import { cva } from "class-variance-authority";

export const namekitLinkVariants = cva("nhui:transition nhui:cursor-pointer", {
  variants: {
    variant: {
      primary:
        "nhui:text-current nhui:underline nhui:decoration-transparent hover:nhui:decoration-current sm:nhui:underline-offset-[4px] sm:nhui:transition-all sm:nhui:duration-200 sm:hover:nhui:underline-offset-[2px]",
      secondary: "nhui:text-gray-500 hover:nhui:text-black",
      underline:
        "nhui:text-current nhui:underline nhui:decoration-current nhui:underline-offset-[4px] nhui:transition-all nhui:duration-200 hover:nhui:underline-offset-[2px]",
    },
    size: {
      xsmall: "nhui:text-xs",
      small: "nhui:text-sm",
      medium: "nhui:text-base",
      large: "nhui:text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "medium",
  },
});
