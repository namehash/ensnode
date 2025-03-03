import BeforeAfterSlider from "../molecules/BeforeAfterSlider.tsx";
import HeroInstallCommand from "../molecules/HeroInstallCommand.tsx";
import {Button, Link} from "@namehash/namekit-react";
import RainbowLogo from "../../assets/ENSRainbowLogo.svg";

export default function Hero() {
    const healedLabels = 233856894;
    const healedLabelsArray = Array.from(String(healedLabels), num => Number(num));
    const counterNumberStyles = "flex flex-col justify-center items-center w-6 sm:w-[52px] h-9 sm:h-[72px] rounded sm:rounded-lg border border-gray-200 text-lg sm:text-2xl leading-7 font-bold bg-white";

    return <div className="box-border bg-gradient-to-b from-white to-[#F9FAFB] h-fit lg:h-full lg:flex flex-col flex-nowrap justify-center items-center lg:max-h-screen">
        <section
            className="md:min-h-[624px] box-border relative z-10 w-full h-fit py-[61px] sm:py-24 px-5 flex flex-col lg:flex-row items-center justify-center md:px-10 xl:py-5">
            <div className="inline-flex flex-col items-start justify-end gap-6 w-1/2 h-fit relative z-20">
                <div className="flex flex-col items-center lg:items-start justify-center gap-5 w-fit h-fit">
                    <div className="w-[84px] h-[84px] rounded-xl p-3 border border-gray-200 bg-white">
                        <img src={RainbowLogo.src} alt="ENSRainbow logo"/>
                    </div>
                    <p className="text-center not-italic uppercase text-gray-500 text-xs tracking-wide font-medium leading-4">
                        An open source public good
                    </p>
                    <h1 className="text-black not-italic font-bold text-4xl leading-10 sm:text-6xl sm:leading-[64px] text-center lg:text-left">
                        Making the{" "}
                        <br className="hidden xl:block"/>
                        unknown, known
                    </h1>
                </div>
                <p className="not-italic font-normal text-gray-500 text-lg leading-7 sm:text-base sm:leading-6 text-center lg:text-left">
                    Heal millions of unknown ENS names with this <a
                    className="text-black underline sm:underline-offset-[4px] sm:transition-all sm:duration-200 sm:hover:underline-offset-[2px]"
                    href="https://ensnode.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ENSNode
                </a> sidecar service.
                </p>
                <HeroInstallCommand/>

                <div className="hidden lg:block relative z-10">
                    <Button variant="primary" size="large" asChild>
                        <Link href="https://ensnode.io/ensrainbow/quickstart">View the docs</Link>
                    </Button>
                </div>
            </div>
            <BeforeAfterSlider/>
        </section>
        <div className="max-w-6xl mx-auto py-6 flex flex-col flex-nowrap justify-start items-center gap-5">
            <p className="text-center not-italic font-normal text-gray-500 text-lg leading-7">
                Unknown labels healed by ENSRainbow and ENSNode
            </p>
            <div className="flex flex-nowrap flex-row justify-center items-center w-[fit-content] gap-1 sm:gap-3">
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