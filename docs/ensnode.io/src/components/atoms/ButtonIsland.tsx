import { Button, Link } from "@namehash/namekit-react";
import React from "react";

export type ButtonIslandProps = {
  text: string | React.ReactNode;
  size: "small" | "medium" | "large";
  variant: "primary" | "secondary" | "ghost";
  linkData?: {
    link: string;
    target?: string;
  };
  styles?: string;
};

export default function ButtonIsland({ text, size, variant, linkData, style }: ButtonIslandProps) {
  return linkData != undefined ? (
    <Button variant={variant} size={size} asChild className={style}>
      <Link target={linkData?.target || "_blank"} href={linkData.link}>
        {text}
      </Link>
    </Button>
  ) : (
    <Button variant={variant} size={size} className={style}>
      {text}
    </Button>
  );
}
