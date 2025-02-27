import {Fragment} from "react";
import AboutRainbow, {AboutRainbowProps} from "./AboutRainbow.tsx";
import ensProfile from "../../assets/ens-profile.svg";
import ensNode from "../../assets/Illustration.svg";
import FullRainbow from "./FullRainbow.tsx";
import {ExternalLinkIcon} from "../atoms/ExternalLinkIcon.tsx";
import {Link} from "@namehash/namekit-react";

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
            millions of names in the ENS manager app (and other ENS apps) don’t appear properly.
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
        sectionHeader: (<>
            <div className="w-[84px] h-[84px] rounded-xl p-3 border border-gray-200 bg-white mb-6">
                <div className="bg-red-600 w-full h-full"></div>
            </div>
            ENSRainbow is a part of<br className="hidden md:block"/>ENSNode</>),
        sectionDescription: <>ENSRainbow is a sidecar service for ENSNode, the new multichain indexer for ENSv2.
            <button className="flex flex-nowrap flex-row justify-center items-center gap-3 bg-white rounded-lg border border-gray-300 mt-6 pl-[17px] py-[9px] pr-[15px] shadow-sm hover:shadow-lg text-base leading-6 font-medium text-black">
                <Link className="flex flex-row flex-nowrap items-center gap-3" href="https://ensnode.io/">Learn more about ENSNode <ExternalLinkIcon /></Link></button>
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