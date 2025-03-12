import { Fragment } from "react";
import { ListSectionElement } from "../../types/listSectionTypes.ts";
import { ListSectionBadge } from "../atoms/ListSectionBadge.tsx";
import { CloudOutlineIcon } from "../atoms/icons/CloudOutlineIcon.tsx";
import { DockerIcon } from "../atoms/icons/DockerIcon.tsx";
import { FileOutlineIcon } from "../atoms/icons/FileOutlineIcon.tsx";
import { GithubIconDevelopers } from "../atoms/icons/GithubIconDevelopers.tsx";
import { GithubIconSmall } from "../atoms/icons/GithubIconSmall.tsx";
import { NpmIcon } from "../atoms/icons/NpmIcon.tsx";
import { RailwayIcon } from "../atoms/icons/RailwayIcon.tsx";
import { TelegramIcon } from "../atoms/icons/TelegramIcon.tsx";
import { DeveloperResourceItem } from "../molecules/DeveloperResourceItem.tsx";

export default function DevelopersSection() {
  return (
    <section className="box-border w-full h-fit flex flex-col py-[60px] px-5 lg:py-[100px] items-center justify-center self-stretch gap-8 xl:gap-12 bg-gradient-to-b to-white from-[#F9FAFB] xl:max-h-screen">
      <div className="flex flex-col justify-center items-center gap-5 max-w-[608px]">
        <div className="inline-flex px-4 py-2 bg-[rgba(0,0,0,0.05)] rounded-3xl gap-2 justify-center items-center z-10">
          <GithubIconSmall />
          <span className="text-black text-center text-sm leading-5 not-italic font-medium z-10">
            Developer resources
          </span>
        </div>
        <h1 className="text-black text-center not-italic z-10 text-2xl leading-8 font-bold md:text-4xl md:leading-10">
          ENSRainbow for Devs
        </h1>
        <p className="text-center not-italic text-gray-500 text-lg leading-7 sm:font-normal font-light">
          All resources are open sourced and MIT licensed for the ENS community.
        </p>
      </div>
      <div className="w-fit h-fit flex flex-col md:flex-row md:flex-wrap max-w-[1220px] items-center justify-center xl:justify-start content-between gap-4">
        {devElements.map((elem, idx) => {
          return <DeveloperResourceItem key={idx} elem={elem} />;
        })}
      </div>
    </section>
  );
}

const DeveloperSectionWrapperStyles =
  "flex flex-row items-center justify-start gap-x-2 gap-y-1 flex-wrap";

const DeveloperSectionTitleStyles =
  "self-stretch not-italic z-10 text-black text-left text-sm leading-6 font-semibold whitespace-nowrap";

const DeveloperSectionIconWrapperStyles =
  "w-11 h-11 p-[10px] flex justify-center items-center flex-shrink-0 bg-black rounded-lg";

const devElements: ListSectionElement[] = [
  {
    header: (
      <div className={DeveloperSectionWrapperStyles}>
        <div className={DeveloperSectionTitleStyles}>GitHub</div>
      </div>
    ),
    text: <Fragment>Visit the GitHub repository.</Fragment>,
    icon: (
      <div className={DeveloperSectionIconWrapperStyles}>
        <GithubIconDevelopers />
      </div>
    ),
    link: "https://github.com/namehash/ensnode",
  },
  {
    header: (
      <div className={DeveloperSectionWrapperStyles}>
        <div className={DeveloperSectionTitleStyles}>Documentation</div>
      </div>
    ),
    text: <Fragment>Learn more about ENSRainbow.</Fragment>,
    icon: (
      <div className={DeveloperSectionIconWrapperStyles}>
        <FileOutlineIcon />
      </div>
    ),
    link: "https://www.ensnode.io/ensrainbow/",
  },
  {
    header: (
      <div className={DeveloperSectionWrapperStyles}>
        <div className={DeveloperSectionTitleStyles}>SDK Client</div>
      </div>
    ),
    text: <Fragment>Get started with the client SDK.</Fragment>,
    icon: (
      <div className={DeveloperSectionIconWrapperStyles}>
        <NpmIcon />
      </div>
    ),
    link: "https://github.com/namehash/ensnode/tree/main/packages/ensrainbow-sdk",
  },
  {
    header: (
      <div className={DeveloperSectionWrapperStyles}>
        <div className={DeveloperSectionTitleStyles}>Host your own ENSRainbow</div>
        <ListSectionBadge width={53} height={20} text="Recommended" />
      </div>
    ),
    text: <Fragment>Deploy easily with prebuilt Docker images.</Fragment>,
    icon: (
      <div className={DeveloperSectionIconWrapperStyles}>
        <DockerIcon />
      </div>
    ),
    link: "https://github.com/namehash/ensnode/pkgs/container/ensnode%2Fensrainbow",
  },
  {
    header: (
      <div className={DeveloperSectionWrapperStyles}>
        <div className={DeveloperSectionTitleStyles}>Open public API</div>
      </div>
    ),
    text: <Fragment>Connect to an ENSRainbow hosted for community use.</Fragment>,
    icon: (
      <div className={DeveloperSectionIconWrapperStyles}>
        <CloudOutlineIcon />
      </div>
    ),
    link: "https://api.ensrainbow.io/v1/heal/0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
  },
  {
    header: (
      <div className={DeveloperSectionWrapperStyles}>
        <div className={DeveloperSectionTitleStyles}>Telegram</div>
      </div>
    ),
    text: <Fragment>Join the ENSNode developer community.</Fragment>,
    icon: (
      <div className={DeveloperSectionIconWrapperStyles}>
        <TelegramIcon className="text-white" />
      </div>
    ),
    link: "http://t.me/ensnode",
  },
  {
    header: (
      <div className={DeveloperSectionWrapperStyles}>
        <div className={DeveloperSectionTitleStyles}>One-click deploys</div>
      </div>
    ),
    text: <Fragment>Deploy instantly with a Railway Template.</Fragment>,
    icon: (
      <div className={DeveloperSectionIconWrapperStyles}>
        <RailwayIcon />
      </div>
    ),
    link: "https://railway.com/template/Ddy-Qg",
  },
];
