import { SVGProps } from "react";

export function ENSRainbowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M2 2H26V6H2V2Z" fill="#FF311C" />
      <path d="M2 14H26V18H2V14Z" fill="#97FF2E" />
      <path d="M2 6H26V10H2V6Z" fill="#FEC401" />
      <path d="M2 18H26V22H2V18Z" fill="#3FE8FF" />
      <path d="M2 10H26V14H2V10Z" fill="#FEFB24" />
      <path d="M2 22H26V26H2V22Z" fill="#9E49FF" />
      <rect x="1" y="1" width="26" height="26" rx="3" stroke="black" strokeWidth="2" />
    </svg>
  );
}
