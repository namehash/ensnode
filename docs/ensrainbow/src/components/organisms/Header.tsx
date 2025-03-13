import { Button, IconButton, Link } from "@namehash/namekit-react";
import ENSRainbow2D from "../../assets/ENSRainbow2D.svg";
import { GithubIcon } from "../atoms/icons/GithubIcon.tsx";
import { TelegramIcon } from "../atoms/icons/TelegramIcon.tsx";
import { ENSRainbowLogo2D } from "../atoms/logos/ENSRainbowLogo2D.tsx";

export default function Header() {
  return (
    <header className="fixed bg-white top-0 w-full z-20 border-b border-gray-300 h-[56px] py-[9px] sm:h-[70px] sm:py-4 select-none">
      <div className="max-w-7xl mx-auto items-center justify-between flex flex-row px-8">
        <div className="flex flex-row lg:gap-2 xl:gap-7 justify-between items-center">
          <div className="flex flex-row justify-between items-center gap-2 sm:gap-[14px] cursor-pointer flex-shrink-0 pr-2">
            <a
              href="/"
              className="text-black not-italic font-bold text-[21.539px] leading-[26.51px] tracking-[-0.907px] sm:text-[26px] sm:leading-8 sm:tracking-[-1.113px]"
            >
              {/*<ENSRainbowLogo2D className="h-8 sm:h-10"/>*/}
              <img
                src={ENSRainbow2D.src}
                className="h-8 headerLogoMatch:h-10"
                alt="ENSRainbow logo"
              />
            </a>
          </div>
        </div>
        <div className="hidden sm:flex items-center justify-center gap-1">
          <Button variant="ghost" asChild>
            <Link href="https://ensnode.io/ensrainbow/">Docs</Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="https://github.com/namehash/ensnode">
              <GithubIcon className="fill-current" />
            </Link>
          </Button>

          <Button variant="ghost" asChild>
            <Link href="http://t.me/ensnode">
              <TelegramIcon className="text-[#1F2937]" />
            </Link>
          </Button>
        </div>
        <div className="sm:hidden flex items-center justify-center gap-1">
          <IconButton asChild variant="ghost">
            <Link
              href="https://ensnode.io/ensrainbow/"
              target="_blank"
              size="small"
              className="hover:no-underline nk-underline-none"
            >
              Docs
            </Link>
          </IconButton>

          <IconButton asChild variant="ghost" className="p-[7px]">
            <Link href="https://github.com/namehash/ensnode">
              <GithubIcon className="fill-current" />
            </Link>
          </IconButton>

          <IconButton asChild variant="ghost" className="p-[7px]">
            <Link href="http://t.me/ensnode">
              <TelegramIcon className="text-[#1F2937]" />
            </Link>
          </IconButton>
        </div>
      </div>
    </header>
  );
}
