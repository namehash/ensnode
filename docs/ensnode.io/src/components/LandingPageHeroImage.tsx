import test_logo from "../assets/test_logo.png";
import ensnode_logo from "../assets/test_ensnode_logo.png";
import BlockchainElement from "@workspace/docs/ensnode.io/src/components/atoms/BlockchainElement.tsx";
import VideoBackground from "@workspace/docs/ensnode.io/src/components/molecules/VideoBackground.tsx";

export default function LandingPageHeroImage() {
    return <section className="not-content h-fit w-full flex flex-row flex-nowrap justify-center items-center gap-5 bg-[#030382] border-2 border-red-500">
        <div className="relative w-3/4 h-[75vh]">
            <div className="absolute z-10 w-full h-full flex flex-row flex-nowrap justify-between items-center">
                <div className="flex flex-col flex-nowrap h-full justify-between items-center">
                    <BlockchainElement imageSource={test_logo.src}/>
                    <BlockchainElement imageSource={test_logo.src}/>
                    <BlockchainElement imageSource={test_logo.src}/>
                </div>
                <div className="flex flex-col flex-nowrap h-1/2 justify-between items-center">
                    <BlockchainElement imageSource={test_logo.src}/>
                    <BlockchainElement imageSource={test_logo.src}/>
                </div>
                <BlockchainElement imageSource={test_logo.src}/>
                <img className="not-content w-28" src={ensnode_logo.src} alt="ENSNode"/>
            </div>
            <VideoBackground/>
        </div>
        <div className="z-10 flex flex-col flex-nowrap justify-between items-end w-1/4 h-full pr-5">
            <h2 className="text-right text-white">ENSNode</h2>
            <h1 className="text-right text-white font-bold text-2xl">The new multichain indexer for ENSv2</h1>
        </div>
    </section>
}