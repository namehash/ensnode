import { namekitButtonVariants } from "@namehash/namehash-ui/namekit";

import { ExternalLinkIcon } from "./icons/ExternalLinkIcon.tsx";
import { cn } from "../../../../../packages/namehash-ui/src/utils/cn.ts";

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
      className={namekitButtonVariants({
        variant: "secondary",
        size: "medium",
        className: cn("max-w-full overflow-x-hidden", styles),
      })}
    >
      {text}
      <ExternalLinkIcon fillColor={iconFillColor} />
    </a>
  );
};
