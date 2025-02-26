import { Button, Link } from "@namehash/namekit-react";
import {GithubIcon} from "../atoms/GithubIcon.tsx";

export default function Header() {
    return (
        <header className="fixed bg-white top-0 w-full z-20 border-b border-gray-300 h-[56px] py-[9px] sm:h-[70px] sm:py-4 select-none">
            <div className="max-w-7xl mx-auto items-center justify-between flex flex-row px-6">
                <div className="flex flex-row lg:gap-2 xl:gap-7 justify-between items-center">
                    <div className="flex flex-row justify-between items-center gap-1 cursor-pointer flex-shrink-0 pr-2">
                        <div className="w-8 h-8 bg-red-600" />
                        <Link
                            href="/"
                            className="text-black not-italic font-bold text-[22.683px] leading-[22.683px] tracking-[-0.907px] sm:text-[27.816px] sm:leading-[27.816px] sm:tracking-[-1.113px]"
                        >
                            ENSRainbow
                        </Link>
                    </div>
                </div>
                <div className="flex flex-row items-center justify-between md:gap-5 h-[40px]">
                    <div className="hidden items-center justify-center lg:flex gap-2">
                        <div className="hidden items-center justify-center xl:flex gap-2">
                            <Button variant="ghost" asChild>
                                <Link href="https://api.nameguard.io/docs">Docs</Link>
                            </Button>

                            <Button variant="ghost" asChild>
                                <Link href="https://github.com/namehash/namekit">
                                    <GithubIcon className="hidden md:block fill-current" />
                                </Link>
                            </Button>
                        </div>

                        <Button variant="ghost" asChild>
                            <Link href="/contact">Paper plane</Link>
                        </Button>

                    </div>
                </div>
            </div>
        </header>
    );
}