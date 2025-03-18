import React from "react";

export const LineaLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="280"
    height="280"
    viewBox="0 0 280 280"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="140" cy="140" r="140" fill="#0D111C" />
    <g clipPath="url(#clip0_663_119364)">
      <path d="M217.532 59H62V220.706H217.532V59Z" fill="#61DFFF" />
      <mask
        id="mask0_663_119364"
        style={{ maskType: "luminance" }}
        maskUnits="userSpaceOnUse"
        x="100"
        y="99"
        width="79"
        height="82"
      >
        <path d="M178.407 99.5103H100.766V180.492H178.407V99.5103Z" fill="white" />
      </mask>
      <g mask="url(#mask0_663_119364)">
        <path
          d="M165.247 180.492H100.766V112.651H115.519V167.344H165.247V180.485V180.492Z"
          fill="#121212"
        />
        <path
          d="M165.248 125.792C172.516 125.792 178.408 119.908 178.408 112.651C178.408 105.394 172.516 99.5103 165.248 99.5103C157.979 99.5103 152.088 105.394 152.088 112.651C152.088 119.908 157.979 125.792 165.248 125.792Z"
          fill="#121212"
        />
      </g>
    </g>
    <defs>
      <clipPath id="clip0_663_119364">
        <rect width="156" height="162" fill="white" transform="translate(62 59)" />
      </clipPath>
    </defs>
  </svg>
);
