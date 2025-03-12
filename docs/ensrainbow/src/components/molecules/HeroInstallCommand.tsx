import { Tooltip } from "@namehash/namekit-react/client";
import { useEffect, useState } from "react";
import { CopyIcon } from "../atoms/icons/CopyIcon.tsx";

const npmCommand = "npm install @ensnode/ensrainbow-sdk";

export default function HeroInstallCommand() {
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);

  const copiedText = <>Copied!</>;
  const copyText = <>Copy to Clipboard</>;

  const displayCopiedFor = 4000;

  useEffect(() => {
    setTimeout(() => {
      setCopiedToClipboard(false);
    }, displayCopiedFor);
  }, [copiedToClipboard]);

  return (
    <div className="hidden relative z-10 lg:flex items-center gap-2 py-[9px] pl-4 pr-[14px] rounded-lg bg-gray-100 border border-gray-300 sm:gap-3 sm:py-[13px] sm:pl-[20px] sm:pr-[16px]">
      <p className="text-black leading-6 font-normal text-sm sm:text-base">{npmCommand}</p>
      <Tooltip
        trigger={
          <div
            className="w-fit h-fit z-10 cursor-pointer"
            onClick={() => {
              setCopiedToClipboard(true);
              navigator.clipboard.writeText(npmCommand);
            }}
          >
            <CopyIcon />
          </div>
        }
      >
        {copiedToClipboard ? copiedText : copyText}
      </Tooltip>
    </div>
  );
}
