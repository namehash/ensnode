import { type SVGProps } from "react";

export const MenuIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M1 1H17M1 7H17M1 13H17"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
