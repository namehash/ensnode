import type React from "react";
import { CheckSolidIcon } from "@components/atoms/icons/CheckSolidIcon";
import { SkullIcon } from "@components/atoms/icons/SkullIcon";
import { Tooltip } from "@namehash/namehash-ui/legacy";
import { useIsMobile } from "@namehash/namehash-ui";
import { useId } from "react";

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
        <button
          type="button"
          aria-label="Not ENSv2 ready"
          className="w-fit flex flex-row flex-nowrap justify-center items-center gap-1 px-1.5 py-0.5 rounded-sm text-white bg-[#ef4444] cursor-default font-semibold leading-5 text-xs"
        >
          <SkullIcon className="w-3 h-3 shrink-0" />
          Not ENSv2 ready
          <NotENSv2ReadyInfoIcon className="w-3 h-3 shrink-0 opacity-50" />
        </button>
      }
    >
      <ENSv2NotReadyTooltipContent transitionStages={transitionStages} />
    </Tooltip>
  );
};

const ENSv2NotReadyTooltipContent = ({ transitionStages }: NotENSv2ReadyBadgeProps) => {
  const transitionInfoStyles = "flex flex-row flex-nowrap justify-start items-start gap-2";

  return (
    <div className="h-fit flex flex-col justify-start items-start gap-2 cursor-default -mx-1 py-1">
      <div className={transitionInfoStyles}>
        {transitionStages.toENSNodeSubgraphCompatibleEndpoint ? (
          <CheckSolidIcon className="w-4 h-4 shrink-0 pt-1 box-content" />
        ) : (
          <NotENSv2ReadyXIcon className="w-4 h-4 shrink-0 pt-1 box-content" />
        )}
        <p className="text-xs leading-5">Transitioned from The Graph to ENSNode</p>
      </div>
      <div className={transitionInfoStyles}>
        {transitionStages.toOmnigraphAPI ? (
          <CheckSolidIcon className="w-4 h-4 shrink-0 pt-1 box-content" />
        ) : (
          <NotENSv2ReadyXIcon className="w-4 h-4 shrink-0 pt-1 box-content" />
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

// Same reason as above: this X icon is unique to this badge
const NotENSv2ReadyXIcon = (props: React.SVGProps<SVGSVGElement>) => {
  const id = useId();
  const patternId = `pattern0_${id}`;
  const imageId = `image0_${id}`;

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="12" height="12" fill={`url(#${patternId})`} />
      <defs>
        <pattern id={patternId} patternContentUnits="objectBoundingBox" width="1" height="1">
          <use href={`#${imageId}`} transform="scale(0.0227273)" />
        </pattern>
        <image
          id={imageId}
          width="44"
          height="44"
          preserveAspectRatio="none"
          href="data:image/png;base64,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"
        />
      </defs>
    </svg>
  );
};
