import {Button, Link} from "@namehash/namekit-react";
import VideoBackground from "@workspace/docs/ensnode.io/src/components/molecules/VideoBackground.tsx";
import {GithubIcon} from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/GithubIcon.tsx";
import ensnode_with_name from "../../assets/dark-logo.svg";
import HeroImage from "@workspace/docs/ensnode.io/src/components/molecules/HeroImage.tsx";
import {ENSAdminLogo} from "@workspace/docs/ensnode.io/src/components/atoms/ENSAdminLogo.tsx";

// gray NameGuard-like dots in the bg -> bg-center bg-[radial-gradient(#DEDEDEB2_1px,transparent_1px)] [background-size:24px_24px]

export default function Hero() {
    return (
        <section
            className="box-border not-content h-screen w-screen flex flex-col flex-nowrap justify-end sm:justify-center items-center gap-8 sm:gap-4 px-5 sm:px-0 sm:pt-[72px] super_wide_hero:pt-0 pb-5 bg-video_bg_sm sm:bg-video_bg">
            <div
                className="absolute top-0 box-border flex flex-row flex-nowrap justify-center items-center w-full px-5 sm:px-10 py-3 z-10">
                <div className="w-full max-w-7xl items-center justify-between flex flex-row">
                    <a href="/">
                        <img
                        className="hidden sm:block h-10"
                        src={ensnode_with_name.src}
                        alt="ENSNode"
                    />
                        <img
                            className="block sm:hidden h-8"
                            src={ensnode_with_name.src}
                            alt="ENSNode"
                        /></a>
                    <div className="hidden sm:flex flex-row flex-nowrap justify-end items-center gap-8">
                        {/*<Button variant="secondary" size="medium" asChild>*/}
                        {/*    <Link href="/ensnode/">*/}
                        {/*        Docs*/}
                        {/*    </Link>*/}
                        {/*</Button>*/}
                        {/*<Button variant="secondary" size="medium" asChild>*/}
                        {/*    <Link href="https://github.com/namehash/ensnode">*/}
                        {/*        <GithubIcon/> GitHub*/}
                        {/*    </Link>*/}
                        {/*</Button>*/}
                        <a
                            href="/ensnode/"
                            className="no-underline hover:no-underline"
                        >
                            <button
                                className="transition-all duration-200 hover:shadow-hero_button_shd flex flex-row flex-nowrap justify-center items-center gap-2 text-white border-2 border-white rounded-lg px-4 py-2">
                                Docs
                            </button>
                        </a>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://github.com/namehash/ensnode"
                            className="no-underline hover:no-underline"
                        >
                            <button
                                className="transition-all duration-200 hover:shadow-hero_button_shd flex flex-row flex-nowrap justify-center items-center gap-2 text-white border-2 border-white rounded-lg px-4 py-2">
                                <GithubIcon className="w-6 h-auto"/> GitHub
                            </button>
                        </a>
                    </div>
                    <div className="sm:hidden flex flex-row flex-nowrap justify-end items-center gap-2">
                        {/*<Button variant="secondary" size="small" asChild>*/}
                        {/*    <Link href="/ensnode/" className="h-8">*/}
                        {/*        Docs*/}
                        {/*    </Link>*/}
                        {/*</Button>*/}
                        {/*<Button variant="secondary" size="small" asChild>*/}
                        {/*    <Link href="https://github.com/namehash/ensnode">*/}
                        {/*        <GithubIcon/>*/}
                        {/*    </Link>*/}
                        {/*</Button>*/}
                        <a
                            href="/ensnode/"
                            className="no-underline hover:no-underline"
                        >
                            <button
                                className="h-8 transition-all duration-200 hover:shadow-hero_button_shd flex flex-row flex-nowrap justify-center items-center gap-2 text-sm text-white border-2 border-white rounded-lg px-2 py-1">
                                Docs
                            </button>
                        </a>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://github.com/namehash/ensnode"
                            className="no-underline hover:no-underline"
                        >
                            <button
                                className="h-8 transition-all duration-200 hover:shadow-hero_button_shd flex flex-row flex-nowrap justify-center items-center gap-2 text-white border-2 border-white rounded-lg px-2 py-1">
                                <GithubIcon className="w-6 h-auto"/>
                            </button>
                        </a>
                    </div>
                </div>
            </div>
            {/*<div className="bg-red-600 w-screen sm:flex flex-row flex-nowrap justify-center items-center hidden">*/}
            {/*    <HeroImage/>*/}
            {/*</div>*/}
            <HeroImage/>
            <div
                className="relative z-10 flex flex-col flex-nowrap justify-center items-center gap-3 sm:gap-6 w-full h-1/4 py-5 sm:py-0">
                <h1 className="text-center font-semibold text-2xl sm:text-5xl text-white">
                    The new multichain indexer for ENSv2
                </h1>
                <div className="flex flex-row flex-nowrap justify-center gap-5 items-center w-full">
                    {/*<Button variant="secondary" size="medium" asChild>*/}
                    {/*    <Link href="https://admin.ensnode.io/">*/}
                    {/*        <ENSAdminLogo className="w-10 h-auto"/>*/}
                    {/*        <div className="flex flex-col flex-nowrap justify-center items-start h-fit w-fit">*/}
                    {/*            Try it now*/}
                    {/*            <p className="text-xs text-left">with ENSAdmin</p>*/}
                    {/*        </div>*/}
                    {/*    </Link>*/}
                    {/*</Button>*/}
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://admin.ensnode.io/"
                        className="no-underline hover:no-underline"
                    >
                        <button
                            className="transition-all duration-200 hover:shadow-hero_button_shd flex flex-row flex-nowrap justify-center items-center gap-2 text-white border-2 border-white rounded-lg px-4 py-2">
                            <ENSAdminLogo className="w-10 h-auto"/>
                            <div className="flex flex-col flex-nowrap justify-center items-start h-fit w-fit">
                                Try it now
                                <p className="text-xs text-left">with ENSAdmin</p>
                            </div>
                        </button>
                    </a>
                    {/*<Button variant="secondary" size="medium" asChild*/}
                    {/*        className="h-[56px] w-[89px] flex flex-col justify-center items-center">*/}
                    {/*    <Link href="/ensnode/">*/}
                    {/*        Docs*/}
                    {/*    </Link>*/}
                    {/*</Button>*/}
                    {/*<a*/}
                    {/*    href="/ensnode/"*/}
                    {/*    className="no-underline hover:no-underline"*/}
                    {/*>*/}
                    {/*    <button*/}
                    {/*        className="h-[59px] w-[89px] transition-all duration-200 hover:shadow-hero_button_shd flex flex-row flex-nowrap justify-center items-center gap-2 text-white border-2 border-white rounded-lg">*/}
                    {/*        Docs*/}
                    {/*    </button>*/}
                    {/*</a>*/}
                </div>
            </div>
        </section>
    )
        ;
}
