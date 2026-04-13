import { legacyButtonVariants } from "@namehash/namehash-ui/legacy";

import { ExternalLinkIcon } from "./icons/ExternalLinkIcon.tsx";
import cc from "classcat";

export type LearnMoreButtonProps = {
  text: string;
  source: string;
  iconFillColor?: string;
  styles?: string;
};

export const LearnMoreButton = ({
  text,
  source,
  iconFillColor = "fill-gray-400",
  styles,
}: LearnMoreButtonProps) => {
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      className={legacyButtonVariants({
        variant: "secondary",
        size: "medium",
        className: cc("max-w-full overflow-x-hidden", styles),
      })}
    >
      {text}
      <ExternalLinkIcon fillColor={iconFillColor} />
    </a>
  );
};
