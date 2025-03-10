import {Fragment} from "react";
import AboutRainbow, {AboutRainbowProps} from "./AboutRainbow.tsx";
import ensNode from "../../assets/Illustration.svg";
import FullRainbow from "./FullRainbow.tsx";
import {LearnMoreButton} from "../atoms/LearnMoreButton.tsx";
import RainbowLogo from "../../assets/ENSRainbowLogo.svg";
import {SectionDivider} from "../atoms/SectionDivider.tsx";
import {Link} from "@namehash/namekit-react";
import {ENSNodeSchema} from "../atoms/ENSNodeSchema.tsx";
import {ENSProfile} from "../atoms/ENSProfile.tsx";
import {ENSProfileMobile} from "../atoms/ENSProfileMobile.tsx";

export default function AboutRainbowSections() {
    return (
        <>
            <Fragment key="What-the-heck-is-section">
                <AboutRainbow {...rainbowSections[0]} />
                <SectionDivider />
            </Fragment>
            <FullRainbow/>
            <SectionDivider />
            <Fragment key="ENSRainbow-is-a-part-of-ENSNode">
                <AboutRainbow {...rainbowSections[1]} />
                <SectionDivider additionalStyles="sm:hidden"/>
            </Fragment>
        </>
    );
}


const rainbowSections: AboutRainbowProps[] = [
    {
        sectionHeader: (<>What the heck is a <br className="hidden md:block"/><p className="whitespace-nowrap">&quot;[428...b0b]&quot;?</p></>),
        sectionDescription: (<>
            These are encoded labelhashes used to represent an unknown label in an ENS name. Without name healing,
            millions of names in the ENS manager app (and&nbsp;other&nbsp;ENS&nbsp;apps) don’t appear properly.
            <br/>
            <Link
                href="https://app.ens.domains/0xfFD1Ac3e8818AdCbe5C597ea076E8D3210B45df5"
                target="_blank"
                className="!text-black"
                variant="underline"
                size="large"
            >
                See an example of the problem ↗
            </Link>
        </>),
        sectionBackgroundName: "",
        isTextOnTheLeft: true,
        mobileImageOnTop: false,
        svgImage: <ENSProfile styles="relative z-10 w-full h-full"/>,
        designatedMobileImage: <ENSProfileMobile  styles="relative z-10 w-full h-full -right-5 shadow-[inset_50px_0px_8px_0px_white]"/>,
    },
    {
        sectionHeader: (<div className="h-fit flex flex-col flex-nowrap justify-center items-center xl:items-start gap-6">
            <div className="hidden md:block w-[84px] h-[84px] rounded-xl p-3 border border-gray-200 bg-white">
                <img src={RainbowLogo.src} alt="ENSRainbow logo"/>
            </div>
            ENSRainbow is a part of{" "}<br className="hidden md:block"/>ENSNode</div>),
        sectionDescription: <>ENSRainbow is a sidecar service for{" "}
            <Link
                href="https://ensnode.io/"
                target="_blank"
                className="!text-black"
                variant="underline"
                size="large"
            >
                ENSNode
            </Link>, the new multichain indexer for ENSv2.
        </>,
        descriptionExternalElements: <LearnMoreButton source="https://ensnode.io/" text="Learn more about ENS Node"/>,
        sectionBackgroundName: "",
        isTextOnTheLeft: true,
        mobileImageOnTop: true,
        normalImage: {
            source: ensNode.src,
            tagWidth: 640,
            tagHeight: 340,
            alt: "ENSNode sidecar service ENSRainbow"
        },
        svgImage: <><ENSNodeSchema styles="relative z-10 w-full h-full"/></>
    }
];