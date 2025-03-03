import {Fragment} from "react";
import AboutRainbow, {AboutRainbowProps} from "./AboutRainbow.tsx";
import ensProfile from "../../assets/ens-profile.svg";
import ensNode from "../../assets/Illustration.svg";
import FullRainbow from "./FullRainbow.tsx";
import {LearnMoreButton} from "../atoms/LearnMoreButton.tsx";
import RainbowLogo from "../../assets/ENSRainbowLogo.svg";

export default function AboutRainbowSections() {
    return (
        <>
            <Fragment key="What-the-heck-is-section">
                <AboutRainbow {...rainbowSections[0]} />
                {/*<MobileSectionDivider />*/}
            </Fragment>
            <FullRainbow/>
            <Fragment key="ENSRainbow-is-a-part-of-ENSNode">
                <AboutRainbow {...rainbowSections[1]} />
                {/*<MobileSectionDivider />*/}
            </Fragment>
        </>
    );
}


const rainbowSections: AboutRainbowProps[] = [
    {
        sectionHeader: (<>What the heck is a<br className="hidden md:block"/>&quot;[428...b0b]&quot;?</>),
        sectionDescription: (<>
            These are encoded labelhashes used to represent an unknown label in an ENS name. Without name healing,
            millions of names in the ENS manager app (and&nbsp;other&nbsp;ENS&nbsp;apps) don’t appear properly.
            <br className="hidden md:block"/>
            <a
                className="text-black underline sm:underline-offset-[4px] sm:transition-all sm:duration-200 sm:hover:underline-offset-[2px]"
                href="https://app.ens.domains/0xfFD1Ac3e8818AdCbe5C597ea076E8D3210B45df5"
                target="_blank"
                rel="noopener noreferrer"
            >
                See an example for yourself ↗
            </a>
        </>),
        sectionBackgroundName: "",
        isTextOnTheLeft: true,
        imageSpecifics: {
            source: ensProfile.src,
            tagWidth: 640,
            tagHeight: 400,
            alt: "ens profile"
        }
    },
    {
        sectionHeader: (<div className="h-fit flex flex-col flex-nowrap justify-center items-center xl:items-start gap-6">
            <div className="w-[84px] h-[84px] rounded-xl p-3 border border-gray-200 bg-white">
                <img src={RainbowLogo.src} alt="ENSRainbow logo"/>
            </div>
            ENSRainbow is a part of{" "}<br className="hidden md:block"/>ENSNode</div>),
        sectionDescription: <>ENSRainbow is a sidecar service for ENSNode, the new multichain indexer for ENSv2.
            <LearnMoreButton source="https://ensnode.io/" styles="mt-6" text="Learn more about ENS Node"/>
        </>,
        sectionBackgroundName: "",
        isTextOnTheLeft: true,
        imageSpecifics: {
            source: ensNode.src,
            tagWidth: 640,
            tagHeight: 340,
            alt: "ENSNode sidecar service ENSRainbow"
        }
    }
];