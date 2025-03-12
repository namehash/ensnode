import { Button, Link } from "@namehash/namekit-react";
import { ExternalLinkIcon } from "./icons/ExternalLinkIcon.tsx";

export type LearnMoreButtonProps = {
  text: string;
  source: string;
  iconFillColor?: string;
  styles?: string;
};

export const LearnMoreButton = (props: LearnMoreButtonProps) => {
  return (
    <Button variant="secondary" className="max-w-[100%] overflow-x-hidden" size="medium" asChild>
      <Link href={props.source}>
        {props.text}
        <ExternalLinkIcon fillColor="fill-gray-400" />
      </Link>
    </Button>
  );
};
