import { legacyButtonVariants } from "@namehash/namehash-ui/legacy";

import ENSRainbow2D from "../../assets/ENSRainbow2D.svg";
import { GithubIcon } from "../atoms/icons/GithubIcon.tsx";
import { TelegramIcon } from "../atoms/icons/TelegramIcon.tsx";

export default function Header() {
  return (
    <header className="fixed bg-white top-0 w-full z-20 border-b border-gray-300 h-[56px] py-[9px] sm:h-[70px] sm:py-4 select-none">
      <div className="max-w-7xl mx-auto items-center justify-between flex flex-row px-8">
        <div className="flex flex-row lg:gap-2 xl:gap-7 justify-between items-center">
          <div className="flex flex-row justify-between items-center gap-2 sm:gap-[14px] cursor-pointer shrink-0 pr-2">
            <a
              href="/"
              className="text-black not-italic font-bold text-[21.539px] leading-[26.51px] tracking-[-0.907px] sm:text-[26px] sm:leading-8 sm:tracking-[-1.113px]"
            >
              {/*<ENSRainbowLogo2D className="h-8 sm:h-10"/>*/}
              <img src={ENSRainbow2D.src} className="h-8 headerLogoMatch:h-10" alt="ENSRainbow" />
            </a>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1">
          <a
            aria-label="Docs"
            href="https://ensnode.io/ensrainbow"
            target="_blank"
            rel="noopener noreferrer"
            className={legacyButtonVariants({
              variant: "ghost",
              className: "max-sm:p-2 max-sm:text-sm",
            })}
          >
            Docs
          </a>

          <a
            aria-label="GitHub"
            href="https://github.com/namehash/ensnode"
            target="_blank"
            rel="noopener noreferrer"
            className={legacyButtonVariants({ variant: "ghost", className: "max-sm:p-2" })}
          >
            <GithubIcon className="fill-current" />
          </a>

          <a
            aria-label="Telegram"
            href="https://t.me/ensnode"
            target="_blank"
            rel="noopener noreferrer"
            className={legacyButtonVariants({ variant: "ghost", className: "max-sm:p-2" })}
          >
            <TelegramIcon className="text-[#1F2937]" />
          </a>
        </div>
      </div>
    </header>
  );
}
