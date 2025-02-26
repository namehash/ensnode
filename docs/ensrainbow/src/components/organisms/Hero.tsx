import HomepageSlider from "../molecules/HomepageSlider.tsx";
import HeroInstallCommand from "../molecules/HeroInstallCommand.tsx";
import {Button, Link} from "@namehash/namekit-react";
import cc from "classcat";

export default function Hero() {
    const healedLabels = 233856894;
    const healedLabelsArray = Array.from(String(healedLabels), num => Number(num));
    const counterNumberStyles = "flex flex-col justify-center items-center w-[52px] h-[72px] rounded-lg border border-gray-200 text-2xl leading-7 font-bold bg-white";

    return <div className="bg-gradient-to-b from-white to-[#F9FAFB]">
        <section
            className="md:min-h-[800px] xl:min-h-[960px] box-border relative z-10 w-full h-full py-[61px] sm:py-24 px-5 flex flex-row items-center justify-center md:px-10 md:pb-5">
            <div className="inline-flex flex-col items-start gap-5 w-1/2 h-fit relative z-20">
                <div className="flex flex-col items-start gap-2 w-fit h-fit">
                    <div className="w-[84px] h-[84px] rounded-xl p-3 border border-gray-200 bg-white">
                        <div className="bg-red-600 w-full h-full"></div>
                    </div>
                    <p className="text-center not-italic uppercase text-gray-500 text-xs tracking-[0.3px] font-medium">
                        An open source public good
                    </p>
                    <h1 className="text-black not-italic font-bold text-4xl leading-10 sm:text-5xl sm:leading-[52px]">
                        Making the <br className="hidden md:block"/>
                        unknown, known
                    </h1>
                </div>
                <p className="not-italic font-normal text-gray-500 text-lg leading-7 sm:text-base sm:leading-6 sm:font-light">
                    Heal millions of unknown ENS names with this <a
                    className="text-black underline sm:underline-offset-[4px] sm:transition-all sm:duration-200 sm:hover:underline-offset-[2px]"
                    href=""
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ENSNode
                </a> sidecar service.
                </p>
                <HeroInstallCommand/>

                <div className="hidden lg:block relative z-10">
                    <Button variant="primary" size="large" asChild>
                        <Link href="https://api.nameguard.io/docs">View the docs</Link>
                    </Button>
                </div>
            </div>
            <HomepageSlider/>
        </section>
        <div className="max-w-6xl mx-auto py-6 space-y-10 flex flex-col flex-nowrap justify-start items-center">
            <p className="text-center not-italic font-light text-gray-500 text-lg leading-7">
                Unknown labels healed by ENSRainbow and ENSNode
            </p>
            <div className="flex flex-nowrap flex-row justify-center items-center w-[fit-content] gap-3">
                {healedLabelsArray.map((elem, idx) => {
                    if ((healedLabelsArray.length - (idx + 1)) % 3 === 0 && idx !== healedLabelsArray.length - 1) {
                        return (
                            <>
                                <div key={`healedNameCounter${idx}`} className={counterNumberStyles}>{elem}</div>
                                <b className="text-2xl leading-7 font-bold">,</b>
                            </>
                        );
                    }
                    else {
                        return (
                            <div key={`healedNameCounter${idx}`} className={counterNumberStyles}>{elem}</div>
                        );
                    }
                })}
            </div>
        </div>
    </div>
}