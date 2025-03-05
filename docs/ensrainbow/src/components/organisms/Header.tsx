import {Button, Link} from "@namehash/namekit-react";
import {GithubIcon} from "../atoms/GithubIcon.tsx";
import {TelegramIcon} from "../atoms/TelegramIcon.tsx";
import RainbowLogo from "../../assets/ENSRainbowLogo.svg";
import {ENSRainbowLogo2D} from "../atoms/ENSRainbowLogo2D.tsx";

export default function Header() {
    return (
        <header
            className="fixed bg-white top-0 w-full z-20 border-b border-gray-300 h-[56px] py-[9px] sm:h-[70px] sm:py-4 select-none">
            <div className="max-w-7xl mx-auto items-center justify-between flex flex-row px-6">
                <div className="flex flex-row lg:gap-2 xl:gap-7 justify-between items-center">
                    <div className="flex flex-row justify-between items-center gap-2 sm:gap-[14px] cursor-pointer flex-shrink-0 pr-2">
                        <ENSRainbowLogo2D/>
                        <a
                            href="/"
                            className="text-black not-italic font-bold text-[21.539px] leading-[26.51px] tracking-[-0.907px] sm:text-[26px] sm:leading-8 sm:tracking-[-1.113px]"
                        >
                            ENSRainbow
                        </a>
                    </div>
                </div>
                <div className="hidden sm:flex items-center justify-center gap-1">
                    <Button variant="ghost" asChild>
                        <Link href="https://www.ensnode.io/ensrainbow/usage/">Docs</Link>
                    </Button>

                    <Button variant="ghost" asChild>
                        <Link href="https://github.com/namehash/ensnode/tree/main/apps/ensrainbow">
                            <GithubIcon className="fill-current"/>
                        </Link>
                    </Button>

                    <Button variant="ghost" asChild>
                        <Link href="http://t.me/ensnode"><TelegramIcon fillColor="#1F2937"/></Link>
                    </Button>
                </div>
                <div className="sm:hidden flex items-center justify-center gap-1">
                    <button className="px-[10px] py-[9px]">
                        <a className="text-sm leading-5 font-medium" href="https://www.ensnode.io/ensrainbow/usage/" target="_blank"
                           rel="noopener noreferrer">Docs</a>
                    </button>

                    <button className="p-[7px]">
                        <Link href="https://github.com/namehash/ensnode/tree/main/apps/ensrainbow">
                            <GithubIcon className="fill-current"/>
                        </Link>
                    </button>

                    <button className="p-[7px]">
                        <Link href="http://t.me/ensnode"><TelegramIcon fillColor="#1F2937"/></Link>
                    </button>
                </div>
            </div>
        </header>
    );
}