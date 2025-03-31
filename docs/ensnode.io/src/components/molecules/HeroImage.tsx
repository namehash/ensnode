import { BASELogo } from "@workspace/docs/ensnode.io/src/components/atoms/BASELogo.tsx";
import { ENSLogo } from "@workspace/docs/ensnode.io/src/components/atoms/ENSLogo.tsx";
import { ENSNodeLogo } from "@workspace/docs/ensnode.io/src/components/atoms/ENSNodeLogo.tsx";
import { EtherumLogo } from "@workspace/docs/ensnode.io/src/components/atoms/EtherumLogo.tsx";
import { LineaLogo } from "@workspace/docs/ensnode.io/src/components/atoms/LineaLogo.tsx";
import { OptimismLogo } from "@workspace/docs/ensnode.io/src/components/atoms/OptimismLogo.tsx";
import { UnichainLogo } from "@workspace/docs/ensnode.io/src/components/atoms/UnichainLogo.tsx";
import VideoBackground from "@workspace/docs/ensnode.io/src/components/molecules/VideoBackground.tsx";
import "../../styles/videoShadowStyles.css";

export default function HeroImage() {
  return (
    <div className="min-h-0 flex-1 flex flex-col justify-center items-center w-full h-full">
      <div className="videoContainer box-border max-h-full min-h-0 relative h-full p-8 flex flex-col justify-center items-center">
        <div className="box-border absolute z-10 w-full h-full flex flex-col sm:flex-row flex-nowrap justify-between items-center sm:pl-16">
          <div className="flex flex-row sm:flex-col flex-nowrap w-full sm:w-fit h-fit sm:h-full justify-evenly sm:justify-between items-center py-10">
            <ENSLogo className="w-[4rem] sm:w-[5rem] lg:w-[5.5rem] h-auto" />
            <OptimismLogo className="w-[4rem] sm:w-[5rem] lg:w-[5.5rem] h-auto" />
            <UnichainLogo className="w-[4rem] sm:w-[5rem] lg:w-[5.5rem] h-auto" />
          </div>
          <div className="flex flex-row sm:flex-col flex-nowrap w-1/2 sm:w-fit h-fit sm:h-2/3 justify-between items-center">
            <BASELogo className="w-[4rem] sm:w-[5rem] lg:w-[5.5rem] h-auto" />
            <LineaLogo className="w-[4rem] sm:w-[5rem] lg:w-[5.5rem] h-auto" />
          </div>
          <EtherumLogo className="w-[4rem] sm:w-[5rem] lg:w-[5.5rem] h-auto" />
          <ENSNodeLogo className="relative w-[5rem] sm:w-[5.5rem] lg:w-[6rem] h-auto top-0 left-0" />
        </div>
        <VideoBackground />
      </div>
    </div>
  );
}
