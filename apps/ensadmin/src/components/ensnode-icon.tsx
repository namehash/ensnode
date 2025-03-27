import { SVGProps } from "react";

export function ENSNodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="1"
        y="1"
        width="26"
        height="26"
        rx="3"
        fill="#528BFF"
        stroke="black"
        strokeWidth="2"
      />
      <path
        d="M8.11704 12.4324C8.29929 12.8207 8.75095 13.5893 8.75095 13.5893L13.941 5.00781L8.8698 8.54183C8.5687 8.73992 8.32306 9.01726 8.14874 9.33421C7.68123 10.3088 7.67331 11.4419 8.11704 12.4324Z"
        fill="url(#paint0_linear_ensnode)"
      />
      <path
        d="M6.05691 15.2533C6.17576 16.9173 6.99984 18.4466 8.32311 19.4529L13.9252 23.3593C13.9252 23.3593 10.4229 18.3039 7.45942 13.2802C7.15831 12.7494 6.96022 12.1709 6.86513 11.5687C6.82551 11.2993 6.82551 11.022 6.86513 10.7446C6.7859 10.8873 6.63534 11.1804 6.63534 11.1804C6.33424 11.7906 6.12822 12.4482 6.03313 13.1218C5.98559 13.827 5.98559 14.5481 6.05691 15.2533Z"
        fill="white"
      />
      <path
        d="M20.3513 15.9347C20.1691 15.5464 19.7174 14.7778 19.7174 14.7778L14.5273 23.3593L19.5907 19.8253C19.8918 19.6272 20.1374 19.3499 20.3117 19.0329C20.7871 18.0504 20.7951 16.9173 20.3513 15.9347Z"
        fill="url(#paint1_linear_ensnode)"
      />
      <path
        d="M22.4118 13.106C22.2929 11.4421 21.4689 9.91276 20.1456 8.90643L14.5435 5C14.5435 5 18.0458 10.0554 21.0093 15.0791C21.3104 15.61 21.5085 16.1884 21.6036 16.7906C21.6432 17.06 21.6432 17.3374 21.6036 17.6147C21.6828 17.4721 21.8334 17.1789 21.8334 17.1789C22.1345 16.5687 22.3405 15.9111 22.4356 15.2376C22.4831 14.5323 22.4831 13.8192 22.4118 13.106Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="paint0_linear_ensnode"
          x1="14.162"
          y1="5.21238"
          x2="7.49953"
          y2="12.4349"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.58" stopColor="#A0A8D4" />
          <stop offset="0.73" stopColor="#8791C7" />
          <stop offset="0.91" stopColor="#6470B4" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_ensnode"
          x1="14.3054"
          y1="23.1503"
          x2="20.9688"
          y2="15.9291"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.58" stopColor="#A0A8D4" />
          <stop offset="0.73" stopColor="#8791C7" />
          <stop offset="0.91" stopColor="#6470B4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
