import BeforeAfterSlider from "../molecules/BeforeAfterSlider.tsx";
import HeroInstallCommand from "../molecules/HeroInstallCommand.tsx";
import {Button, Link} from "@namehash/namekit-react";
import RainbowLogo from "../../assets/ENSRainbowLogo.svg";

export default function Hero() {
    const healedLabels = 233856894;
    const healedLabelsArray = Array.from(String(healedLabels), num => Number(num));
    const counterNumberStyles = "flex flex-col justify-center items-center w-6 sm:w-[52px] h-9 sm:h-[72px] rounded sm:rounded-lg border border-gray-200 text-lg sm:text-2xl leading-7 font-bold bg-white";

    return <div className="box-border py-[60px] pt-[100px] sm:py-24 lg:py-5 lg:pt-24 px-5 md:px-10 bg-gradient-to-b from-white to-[#F9FAFB] h-fit lg:h-full lg:flex flex-col flex-nowrap justify-center items-center xl:gap-5 lg:max-h-screen">
        <section
            className="box-border relative z-10 w-full h-fit flex flex-col lg:flex-row items-center justify-center gap-5 pb-14 sm:pb-0">
            <div className="w-full lg:w-1/3 box-border sm:hidden flex flex-col flex-nowrap justify-start items-center pb-[49px]">
                <BeforeAfterSlider/>
                <div className="sliderShadow w-1/2 sm:w-2/3 h-6 sm:h-[58px] shrink-0 rounded-[550px] opacity-10"></div>
            </div>
            <div
                className="inline-flex flex-col items-center lg:items-start justify-end gap-5 sm:gap-6 w-full lg:w-1/2 h-fit relative z-20">
                <div className="flex flex-col items-center lg:items-start justify-center gap-2 sm:gap-5 w-fit h-fit">
                    <div className="hidden sm:block w-[84px] h-[84px] rounded-xl p-3 border border-gray-200 bg-white">
                        <img src={RainbowLogo.src} alt="ENSRainbow logo"/>
                    </div>
                    <p className="text-center not-italic uppercase text-gray-500 text-xs tracking-wide font-medium leading-4">
                        An open source public good
                    </p>
                    <h1 className="text-black not-italic font-bold text-4xl leading-10 sm:text-5xl sm:leading-[52px] xl:text-6xl xl:leading-[64px] text-center lg:text-left">
                        Making the{" "}
                        <br className="hidden xl:block"/>
                        unknown, known
                    </h1>
                </div>
                <p className="not-italic font-normal text-gray-500 text-lg leading-7 sm:text-base sm:leading-6 text-center lg:text-left">
                    Heal millions of unknown ENS names with this <Link
                        href="https://ensnode.io/"
                        target="_blank"
                        className="!text-black"
                        variant="underline"
                        size="medium"
                    >
                        ENSNode
                    </Link> sidecar service.
                </p>

                <HeroInstallCommand/>

                <div className="block relative z-10 pt-3 lg:hidden">
                    <Button asChild>
                        <Link href="https://www.ensnode.io/ensrainbow/usage/">View the docs</Link>
                    </Button>
                </div>
                <div className="hidden lg:block relative z-10">
                    <Button variant="primary" size="large" asChild>
                        <Link href="https://www.ensnode.io/ensrainbow/usage/">View the docs</Link>
                    </Button>
                </div>
            </div>
            <div className="w-full lg:w-1/3 box-border hidden sm:flex flex-col flex-nowrap justify-start items-center">
                <BeforeAfterSlider/>
                <div className="sliderShadow w-1/2 sm:w-2/3 h-6 sm:h-[58px] shrink-0 rounded-[550px] opacity-10"></div>
            </div>
        </section>
        <div className="max-w-6xl mx-auto pt-5 flex flex-col flex-nowrap justify-start items-center gap-4 sm:gap-5">
            <p className="text-center not-italic font-normal text-gray-500 text-lg leading-7">
                Unknown labels healed by ENSRainbow and ENSNode
            </p>
            <div className="flex flex-nowrap flex-row justify-center items-center w-[fit-content] gap-1 sm:gap-3">
                {healedLabelsArray.map((elem, idx) => {
                    if ((healedLabelsArray.length - (idx + 1)) % 3 === 0 && idx !== healedLabelsArray.length - 1) {
                        return (
                            <div key={`healedNameCounter${idx}`} className="flex flex-row flex-nowrap justify-center items-center gap-1 sm:gap-3">
                                <div className={counterNumberStyles}>{elem}</div>
                                <b className="text-2xl leading-7 font-bold">,</b>
                            </div>
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