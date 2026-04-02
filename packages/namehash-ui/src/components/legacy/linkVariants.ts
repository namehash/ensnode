import { cva } from "class-variance-authority";

export const legacyLinkVariants = cva("nhui:transition nhui:cursor-pointer", {
  variants: {
    variant: {
      primary:
        "nhui:text-current nhui:underline nhui:decoration-transparent nhui:hover:decoration-current nhui:sm:underline-offset-[4px] nhui:sm:transition-all nhui:sm:duration-200 nhui:sm:hover:underline-offset-[2px]",
      secondary: "nhui:text-gray-500 nhui:hover:text-black",
      underline:
        "nhui:text-current nhui:underline nhui:decoration-current nhui:underline-offset-[4px] nhui:transition-all nhui:duration-200 nhui:hover:underline-offset-[2px]",
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
