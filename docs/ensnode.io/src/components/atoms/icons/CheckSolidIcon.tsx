import type React from "react";
import { useId } from "react";

export const CheckSolidIcon = (props: React.SVGProps<SVGSVGElement>) => {
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
