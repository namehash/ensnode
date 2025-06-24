import HeaderMobileNavigation from "@workspace/docs/ensnode.io/src/components/molecules/HeaderMobileNavigation.tsx";
import { GithubIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/GithubIcon.tsx";
import { TelegramIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TelegramIcon.tsx";
import { TwitterIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TwitterIcon.tsx";
import "../../styles/onScrollHeader.css";
import cc from "classcat";

export type HeaderButtonsProps = {
  isScrollable: boolean;
};
export default function HeaderButtons({ isScrollable }: HeaderButtonsProps) {
  return (
    <>
      <div className="hidden sm:flex items-center justify-end gap-1">
        <a
          href="/docs/"
          className="text-black border-transparent hover:bg-black/5 transition text-base rounded-lg border font-medium inline-flex gap-2 items-center whitespace-nowrap no-underline py-2 px-4"
        >
          <p
            className={cc(["text-sm font-medium leading-6", isScrollable ? "onScrollElement" : ""])}
          >
            Docs
          </p>
        </a>

        <a
          href="https://x.com/NamehashLabs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black border-transparent hover:bg-black/5 transition text-base rounded-lg border font-medium inline-flex gap-2 items-center whitespace-nowrap no-underline py-2 px-4"
        >
          <TwitterIcon className={cc({ onScrollElement: isScrollable })} />
        </a>

        <a
          href="https://github.com/namehash/ensnode"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black border-transparent hover:bg-black/5 transition text-base rounded-lg border font-medium inline-flex gap-2 items-center whitespace-nowrap no-underline py-2 px-4"
        >
          <GithubIcon className={cc({ onScrollElement: isScrollable })} />
        </a>

        <a
          href="http://t.me/ensnode"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black border-transparent hover:bg-black/5 transition text-base rounded-lg border font-medium inline-flex gap-2 items-center whitespace-nowrap no-underline py-2 px-4"
        >
          <TelegramIcon className={cc({ onScrollElement: isScrollable })} />
        </a>
      </div>
      <div className="sm:hidden flex items-center justify-center gap-1">
        <HeaderMobileNavigation />
      </div>
    </>
  );
}
