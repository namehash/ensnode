import { ENSAdminLogoDark } from "@workspace/docs/ensnode.io/src/components/atoms/ENSAdminLogoDark.tsx";
import HeroImage from "@workspace/docs/ensnode.io/src/components/molecules/HeroImage.tsx";
import { GithubIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/GithubIcon.tsx";
import ensnode_with_name from "../../assets/dark-logo.svg";

export default function Hero() {
  return (
    <section className="box-border not-content h-screen w-screen max-h-screen max-w-screen overflow-hidden flex flex-col flex-nowrap items-stretch sm:px-0 bg-hero_bg_sm sm:bg-hero_bg">
      <div className="box-border flex flex-row flex-nowrap justify-center items-center w-full px-5 sm:px-16 py-3">
        <div className="w-full max-w-7xl items-center justify-between flex flex-row">
          <a href="/">
            <img className="hidden sm:block h-10" src={ensnode_with_name.src} alt="ENSNode" />
            <img className="block sm:hidden h-8" src={ensnode_with_name.src} alt="ENSNode" />
          </a>
          <div className="hidden sm:flex flex-row flex-nowrap justify-end items-center gap-8">
            <a href="/ensnode/" className="no-underline hover:no-underline">
              <button className="transition-all duration-200 bg-white bg-opacity-10 hover:bg-opacity-20 flex flex-row flex-nowrap justify-center items-center gap-2 text-white rounded-lg px-4 py-2">
                Docs
              </button>
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/namehash/ensnode"
              className="no-underline hover:no-underline"
            >
              <button className="transition-all duration-200 bg-white bg-opacity-10 hover:bg-opacity-20 flex flex-row flex-nowrap justify-center items-center gap-2 text-white rounded-lg px-4 py-2">
                <GithubIcon className="w-6 h-auto" /> GitHub
              </button>
            </a>
          </div>
          <div className="sm:hidden flex flex-row flex-nowrap justify-end items-center gap-2">
            <a href="/ensnode/" className="no-underline hover:no-underline">
              <button className="h-8 transition-all duration-200 bg-white bg-opacity-10 hover:bg-opacity-20 flex flex-row flex-nowrap justify-center items-center gap-2 text-sm text-white rounded-lg px-2 py-1">
                Docs
              </button>
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/namehash/ensnode"
              className="no-underline hover:no-underline"
            >
              <button className="h-8 transition-all duration-200 bg-white bg-opacity-10 hover:bg-opacity-20 flex flex-row flex-nowrap justify-center items-center gap-2 text-white rounded-lg px-2 py-1">
                <GithubIcon className="w-6 h-auto" />
              </button>
            </a>
          </div>
        </div>
      </div>
      <HeroImage />
      <div className="flex flex-col flex-nowrap justify-center items-center gap-3 sm:gap-6 w-full px-5 py-8">
        <h1 className="text-center font-semibold text-2xl sm:text-5xl text-white">
          The new multichain indexer for ENSv2
        </h1>
        <div className="flex flex-row flex-nowrap justify-center gap-5 items-center w-full">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://admin.ensnode.io/"
            className="no-underline hover:no-underline"
          >
            <button className="transition-all duration-200 bg-white bg-opacity-10 hover:bg-opacity-20 flex flex-row flex-nowrap justify-center items-center gap-2 rounded-lg pl-2 pr-3 py-2">
              <ENSAdminLogoDark className="w-10 h-auto" />
              <div className="flex flex-col flex-nowrap justify-center items-start h-fit w-fit text-white text-sm font-semibold leading-5">
                Connect now
                <p className="text-xs text-center font-normal leading-5 text-gray-400 w-full">
                  with ENSAdmin
                </p>
              </div>
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}
