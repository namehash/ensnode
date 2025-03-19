import {BASELogo} from "@workspace/docs/ensnode.io/src/components/atoms/BASELogo.tsx";
import {ENSLogo} from "@workspace/docs/ensnode.io/src/components/atoms/ENSLogo.tsx";
import {ENSNodeLogo} from "@workspace/docs/ensnode.io/src/components/atoms/ENSNodeLogo.tsx";
import {EtherumLogo} from "@workspace/docs/ensnode.io/src/components/atoms/EtherumLogo.tsx";
import {LineaLogo} from "@workspace/docs/ensnode.io/src/components/atoms/LineaLogo.tsx";
import {OptimismLogo} from "@workspace/docs/ensnode.io/src/components/atoms/OptimismLogo.tsx";
import {UnichainLogo} from "@workspace/docs/ensnode.io/src/components/atoms/UnichainLogo.tsx";
import VideoBackground from "@workspace/docs/ensnode.io/src/components/molecules/VideoBackground.tsx";
import ensnode_with_name from "../../assets/dark-logo.svg";
import {GithubIcon} from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/GithubIcon.tsx";
import {Button, Link} from "@namehash/namekit-react";
import {ENSAdminLogo} from "@workspace/docs/ensnode.io/src/components/atoms/ENSAdminLogo.tsx";

export default function LandingPageHeroImage() {
    return (
        <section
            className="box-border not-content h-screen w-screen flex flex-col sm:flex-row flex-nowrap justify-center items-center gap-5 bg-hero_bg_sm sm:bg-hero_bg px-5 sm:px-0">
            <div className="relative w-screen sm:w-2/3 h-full overflow-hidden">
                <div
                    className="absolute z-10 w-full h-full flex flex-col sm:flex-row flex-nowrap justify-between items-center sm:pl-10">
                    <div
                        className="flex flex-row sm:flex-col flex-nowrap w-full sm:w-fit h-fit sm:h-full justify-evenly sm:justify-between items-center pt-2 sm:py-5">
                        <ENSLogo className="w-16 sm:w-[100px] h-auto"/>
                        <OptimismLogo className="w-16 sm:w-[100px] h-auto"/>
                        <UnichainLogo className="w-16 sm:w-[100px] h-auto"/>
                    </div>
                    <div
                        className="flex flex-row sm:flex-col flex-nowrap w-1/2 sm:w-fit h-fit sm:h-1/2 justify-between items-center">
                        <BASELogo className="w-16 sm:w-[100px] h-auto"/>
                        <LineaLogo className="w-16 sm:w-[100px] h-auto"/>
                    </div>
                    <EtherumLogo className="w-16 sm:w-[100px] h-auto"/>
                    <ENSNodeLogo className="w-1/5 sm:w-[148px] h-auto"/>
                </div>
                <VideoBackground/>
            </div>
            <div
                className="relative z-10 flex flex-col flex-nowrap justify-center items-center gap-8 sm:justify-evenly sm:gap-80 sm:items-end w-full sm:w-1/3 h-1/2 sm:h-full py-5 sm:py-0">
                <img
                    className="sm:absolute sm:top-20 sm:right-10 w-1/3 sm:w-[60%]"
                    src={ensnode_with_name.src}
                    alt="ENSNode"
                />
                <div
                    className="sm:absolute sm:bottom-10 sm:right-10 flex flex-col flex-nowrap justify-start items-center sm:items-end gap-4">
                    <h1 className="text-center sm:text-right text-white font-semibold text-2xl sm:text-6xl sm:w-[600px]">
                        The new
                        <br/> multichain indexer for ENSv2
                    </h1>
                    <a
                        href="/ensnode/"
                        className="w-fit whitespace-nowrap text-lg text-right text-white hover:cursor-pointer underline underline-offset-[4px] hover:underline-offset-[2px] transition-all duration-200 sm:pb-2"
                    >
                        Documentation &rarr;
                    </a>
                    <div className="flex flex-row flex-nowrap justify-end items-center gap-8">
                        <a target="_blank" rel="noopener noreferrer" href="https://github.com/namehash/ensnode"
                           className="no-underline hover:no-underline">
                            <button
                                className="transition-all duration-200 hover:shadow-hero_button_shd flex flex-row flex-nowrap justify-center items-center gap-2 text-white border-2 border-white rounded-lg px-4 py-2">
                                <GithubIcon
                                    className="w-10 h-auto"/> GitHub
                            </button>
                        </a>
                        <Button variant="secondary" size="medium" asChild>
                            <Link href="https://github.com/namehash/ensnode"><GithubIcon
                                className="w-10 h-auto"/> GitHub</Link>
                        </Button>
                        <Button variant="secondary" size="medium" asChild>
                            <Link href="https://admin.ensnode.io/">
                                <ENSAdminLogo className="w-10 h-auto"/>
                                <div className="flex flex-col flex-nowrap justify-center items-start h-fit w-fit">
                                    Try it now
                                    <p className="text-xs text-left">with ENSAdmin</p>
                                </div>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
