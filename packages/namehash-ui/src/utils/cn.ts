import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Adds the nhui: prefix to Tailwind utility classes
 */
function prefixClasses(classes: string): string {
  return classes
    .split(" ")
    .map((className) => {
      // Skip if already prefixed
      if (className.startsWith("nhui:")) {
        return className;
      }
      // Skip arbitrary values and special classes
      if (className.startsWith("[") || className.startsWith("!")) {
        return className;
      }
      // Add prefix to Tailwind utilities
      return `nhui:${className}`;
    })
    .join(" ");
}

export function cn(...inputs: ClassValue[]) {
  return prefixClasses(twMerge(clsx(inputs)));
}
