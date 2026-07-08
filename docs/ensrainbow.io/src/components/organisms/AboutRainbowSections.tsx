import { legacyLinkVariants } from "@namehash/namehash-ui/legacy";
import { Fragment } from "react";

import ensNodeBannerBg from "../../assets/ENSNodeBannerBg.svg";
import RainbowLogo from "../../assets/ENSRainbowLogo.svg";
import { ENSNodeBanner } from "../atoms/ENSNodeBanner.tsx";
import { ENSProfile } from "../atoms/ENSProfile.tsx";
import { ENSProfileMobile } from "../atoms/ENSProfileMobile.tsx";
import { LearnMoreButton } from "../atoms/LearnMoreButton.tsx";
import { SectionDivider } from "../atoms/SectionDivider.tsx";
import AboutRainbow, { type AboutRainbowProps } from "./AboutRainbow.tsx";
import FullRainbow from "./FullRainbow.tsx";

export default function AboutRainbowSections() {
  return (
    <>
      <Fragment key="What-the-heck-is-section">
        <AboutRainbow {...rainbowSections[0]} />
        <SectionDivider />
      </Fragment>
      <FullRainbow />
      <SectionDivider />
      <Fragment key="ENSRainbow-is-a-part-of-ENSNode">
        <AboutRainbow {...rainbowSections[1]} />
        <SectionDivider additionalStyles="sm:hidden" />
      </Fragment>
    </>
  );
}

const linkStyles = legacyLinkVariants({
  variant: "underline",
  size: "large",
  className: "text-black!",
});

const rainbowSections: AboutRainbowProps[] = [
  {
    sectionHeader: (
      <>
        What the heck is a <br className="hidden md:block" />
        <p className="whitespace-nowrap">&quot;[428...b0b]&quot;?</p>
      </>
    ),
    sectionDescription: (
      <>
        These are encoded labelhashes used to represent an unknown label in an ENS name. Without
        name healing, millions of names in the ENS manager app (and other ENS apps) don’t appear
        properly. See the problem for yourself:{" "}
        <a
          href="https://app.ens.domains/0xfFD1Ac3e8818AdCbe5C597ea076E8D3210B45df5"
          target="_blank"
          rel="noopener noreferrer"
          className={linkStyles}
        >
          Example 1
        </a>{" "}
        and{" "}
        <a
          href="https://app.ens.domains/[4283f2583432677d3dac6d2c021cdd7ef6855349ea584813ad5811c0e497eb0b].makoto.eth"
          target="_blank"
          rel="noopener noreferrer"
          className={linkStyles}
        >
          Example 2
        </a>
      </>
    ),
    sectionBackgroundName: "",
    isTextOnTheLeft: true,
    mobileImageOnTop: false,
    svgImage: <ENSProfile styles="relative z-10 w-full h-full" />,
    designatedMobileImage: (
      <ENSProfileMobile styles="relative z-10 w-full h-full -right-5 shadow-[inset_50px_0px_8px_0px_white]" />
    ),
  },
  {
    sectionHeader: (
      <div className="h-fit flex flex-col flex-nowrap justify-center items-center xl:items-start gap-6">
        <div className="hidden md:block w-[84px] h-[84px] rounded-xl p-3 border border-gray-200 bg-white">
          <img src={RainbowLogo.src} alt="ENSRainbow logo" />
        </div>
        ENSRainbow is a part of <br className="hidden md:block" />
        ENSNode
      </div>
    ),
    sectionDescription: (
      <>
        ENSRainbow is a sidecar service for{" "}
        <a
          href="https://ensnode.io/"
          target="_blank"
          rel="noopener noreferrer"
          className={linkStyles}
        >
          ENSNode
        </a>
        , the full&#8288;&#8211;&#8288;stack development platform for ENSv2.
      </>
    ),
    descriptionExternalElements: (
      <LearnMoreButton source="https://ensnode.io/" text="Learn more about ENS Node" />
    ),
    sectionBackgroundName: "",
    isTextOnTheLeft: true,
    mobileImageOnTop: true,
    svgImage: (
      <div className="w-full flex flex-row justify-center items-center xl:justify-end pt-7 pb-5 sm:max-xl:pt-16 sm:max-xl:pb-8">
        <div className="relative w-full max-w-[640px] aspect-[640/340] flex items-center justify-center">
          <img
            src={ensNodeBannerBg.src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full rotate-180"
          />
          <div className="relative z-10 w-[68.75%] aspect-[11/6] flex items-center justify-center bg-white border border-gray-200 rounded-[20px]">
            <ENSNodeBanner styles="w-[55%] max-w-[240px] h-auto" />
          </div>
        </div>
      </div>
    ),
  },
];
