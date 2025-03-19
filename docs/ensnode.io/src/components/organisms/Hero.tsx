import {Button, Link} from "@namehash/namekit-react";
import VideoBackground from "@workspace/docs/ensnode.io/src/components/molecules/VideoBackground.tsx";
import {GithubIcon} from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/GithubIcon.tsx";
import ensnode_with_name from "../../assets/light-logo.svg";
import HeroImage from "@workspace/docs/ensnode.io/src/components/molecules/HeroImage.tsx";
import {ENSAdminLogo} from "@workspace/docs/ensnode.io/src/components/atoms/ENSAdminLogo.tsx";

export default function Hero() {
    return (
        <section
            className="box-border not-content h-screen w-screen flex flex-col flex-nowrap justify-center items-center gap-5 px-5 sm:px-0">
            <div className="flex flex-row flex-nowrap justify-between items-center w-full">
                <img
                    className="w-[100px]"
                    src={ensnode_with_name.src}
                    alt="ENSNode"
                />
                <div className="flex flex-row flex-nowrap justify-end items-center gap-8">
                    <Button variant="primary" size="medium" asChild>
                        <Link href="/ensnode/">
                            Docs
                        </Link>
                    </Button>
                    <Button variant="primary" size="medium" asChild>
                        <Link href="https://github.com/namehash/ensnode">
                            <GithubIcon /> GitHub
                        </Link>
                    </Button>
                </div>
            </div>
            <HeroImage/>
            <div
                className="relative z-10 flex flex-col flex-nowrap justify-center items-center gap-8 w-full h-1/3 py-5 sm:py-0">
                <h1 className="text-center font-semibold text-2xl sm:text-5xl">
                    The new multichain indexer for ENSv2
                </h1>
                <div className="flex flex-row flex-nowrap justify-center gap-5 items-center w-full">
                    <Button variant="primary" size="medium" asChild>
                        <Link href="https://admin.ensnode.io/">
                            <ENSAdminLogo className="w-10 h-auto"/>
                            <div className="flex flex-col flex-nowrap justify-center items-start h-fit w-fit">
                                Try it now
                                <p className="text-xs text-left">with ENSAdmin</p>
                            </div>
                        </Link>
                    </Button>
                    <Button variant="primary" size="medium" asChild className="h-[56px] w-[89px] flex flex-col justify-center items-center">
                        <Link href="/ensnode/">
                            Docs
                        </Link>
                    </Button>
                </div>
            </div>
</section>
)
    ;
}
