import React from "react";

export const LineaTestnetIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_75_253)">
      <path d="M20 0H0V20H20V0Z" fill="#FFB300" />
      <mask
        id="mask0_75_253"
        style={{ maskType: "luminance" }}
        maskUnits="userSpaceOnUse"
        x="5"
        y="5"
        width="11"
        height="10"
      >
        <path d="M15.1779 5.00134H5.72156V14.9991H15.1779V5.00134Z" fill="white" />
      </mask>
      <g mask="url(#mask0_75_253)">
        <path
          d="M13.5751 14.9991H5.72156V6.62366H7.51845V13.3759H13.5751V14.9982V14.9991Z"
          fill="#121212"
        />
        <path
          d="M13.5751 8.24597C14.4603 8.24597 15.178 7.51964 15.178 6.62366C15.178 5.72768 14.4603 5.00134 13.5751 5.00134C12.6898 5.00134 11.9723 5.72768 11.9723 6.62366C11.9723 7.51964 12.6898 8.24597 13.5751 8.24597Z"
          fill="#121212"
        />
      </g>
    </g>
    <defs>
      <clipPath id="clip0_75_253">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
