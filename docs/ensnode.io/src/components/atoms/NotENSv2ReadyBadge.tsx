import type React from "react";
import { CheckSolidIcon } from "@components/atoms/icons/CheckSolidIcon";
import { SkullIcon } from "@components/atoms/icons/SkullIcon";
import { XMarkIcon } from "@components/atoms/icons/XMarkIcon";
import { Tooltip } from "@namehash/namehash-ui/legacy";
import { useIsMobile } from "@namehash/namehash-ui";

export interface ENSSubgraphDependentApplicationTransitionStages {
  toENSNodeSubgraphCompatibleEndpoint: boolean;
  toOmnigraphAPI: boolean;
}

interface NotENSv2ReadyBadgeProps {
  transitionStages: ENSSubgraphDependentApplicationTransitionStages;
}
export const NotENSv2ReadyBadge = ({ transitionStages }: NotENSv2ReadyBadgeProps) => {
  const isMobile = useIsMobile(440);
  return (
    <Tooltip
      sideOffset={-4}
      maxTooltipWidth={250}
      placement={isMobile ? "bottom" : "right"}
      trigger={
        <span className="w-fit flex flex-row flex-nowrap justify-center items-center gap-1 px-1.5 py-0.5 rounded-sm text-white bg-[#ef4444] cursor-default font-semibold leading-5 text-xs">
          <SkullIcon className="w-3 h-3 shrink-0" />
          Not ENSv2 ready
          <NotENSv2ReadyInfoIcon className="w-3 h-3 shrink-0 opacity-50" />
        </span>
      }
    >
      <ENSv2NotReadyTooltipContent transitionStages={transitionStages} />
    </Tooltip>
  );
};

const ENSv2NotReadyTooltipContent = ({ transitionStages }: NotENSv2ReadyBadgeProps) => {
  const transitionInfoStyles = "flex flex-row flex-nowrap justify-start items-start gap-1.5";

  return (
    <div className="h-fit flex flex-col justify-start items-start gap-2 cursor-default -mx-1 py-1">
      <div className={transitionInfoStyles}>
        {transitionStages.toENSNodeSubgraphCompatibleEndpoint ? (
          <CheckSolidIcon className="w-5 h-5 shrink-0 pt-1" />
        ) : (
          <XMarkIcon className="w-5 h-5 shrink-0 stroke-red-500 stroke-2 pt-0.5" />
        )}
        <p className="text-xs leading-5">Transitioned from The Graph to ENSNode</p>
      </div>
      <div className={transitionInfoStyles}>
        {transitionStages.toOmnigraphAPI ? (
          <CheckSolidIcon className="w-5 h-5 shrink-0 pt-1" />
        ) : (
          <XMarkIcon className="w-5 h-5 shrink-0 stroke-red-500 stroke-2 pt-0.5" />
        )}
        <p className="text-xs leading-5">Transitioned from the Subgraph API to the Omnigraph API</p>
      </div>
    </div>
  );
};

// This icon is located here (and not exported)
// because this variant of info icon is only used in this badge
// and nowhere else in the codebase
const NotENSv2ReadyInfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    {...props}
  >
    <path
      d="M6 0C9.31371 0 12 2.68629 12 6C12 9.31371 9.31371 12 6 12C2.68629 12 0 9.31371 0 6C0 2.68629 2.68629 0 6 0ZM5 5C4.58579 5 4.25 5.33579 4.25 5.75C4.25 6.16421 4.58579 6.5 5 6.5H5.25293C5.41287 6.5 5.53176 6.64856 5.49707 6.80469L5.25293 8C5.01013 9.09286 5.84239 10.1299 6.96191 10.1299H7.21484C7.62897 10.1299 7.96471 9.79398 7.96484 9.37988C7.96484 8.96567 7.62906 8.62988 7.21484 8.62988H6.96191C6.80198 8.62988 6.68308 8.48132 6.71777 8.3252L6.96191 7.12988C7.20478 6.03698 6.37249 5 5.25293 5H5ZM6 2C5.44771 2 5 2.44772 5 3C5 3.55228 5.44771 4 6 4C6.55228 4 7 3.55228 7 3C7 2.44772 6.55228 2 6 2Z"
      fill="currentColor"
    />
  </svg>
);
