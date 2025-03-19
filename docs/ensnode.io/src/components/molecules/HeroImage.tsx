import {ENSLogo} from "@workspace/docs/ensnode.io/src/components/atoms/ENSLogo.tsx";
import {OptimismLogo} from "@workspace/docs/ensnode.io/src/components/atoms/OptimismLogo.tsx";
import {UnichainLogo} from "@workspace/docs/ensnode.io/src/components/atoms/UnichainLogo.tsx";
import {BASELogo} from "@workspace/docs/ensnode.io/src/components/atoms/BASELogo.tsx";
import {LineaLogo} from "@workspace/docs/ensnode.io/src/components/atoms/LineaLogo.tsx";
import {EtherumLogo} from "@workspace/docs/ensnode.io/src/components/atoms/EtherumLogo.tsx";
import {ENSNodeLogo} from "@workspace/docs/ensnode.io/src/components/atoms/ENSNodeLogo.tsx";
import VideoBackground from "@workspace/docs/ensnode.io/src/components/molecules/VideoBackground.tsx";

export default function HeroImage() {
    return <div className="relative w-screen sm:w-2/3 h-full overflow-hidden">
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
}