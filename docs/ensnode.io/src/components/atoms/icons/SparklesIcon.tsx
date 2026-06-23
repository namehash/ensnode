import type { SVGProps } from "react";

export const SparklesIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12 3v4" />
    <path d="M12 17v4" />
    <path d="M3 12h4" />
    <path d="M17 12h4" />
    <path d="m5.64 5.64 2.83 2.83" />
    <path d="m15.53 15.53 2.83 2.83" />
    <path d="m5.64 18.36 2.83-2.83" />
    <path d="m15.53 8.47 2.83-2.83" />
  </svg>
);
