import VideoAsciiAnimation from "@workspace/docs/ensnode.io/src/components/molecules/VideoAsciiAnimation.tsx";
import test_logo from "../assets/test_logo.png";
import BlockchainElement from "@workspace/docs/ensnode.io/src/components/atoms/BlockchainElement.tsx";

export default function LandingPageHeroImage() {
    return <section className="flex flex-row flex-nowrap justify-center items-center">
        <div className="flex flex-row flex-nowrap justify-start items-center w-3/4 gap-12">
            <div className="flex flex-col flex-nowrap justify-between items-center">
                <BlockchainElement imageSource={test_logo.src} />
                <BlockchainElement imageSource={test_logo.src} />
                <BlockchainElement imageSource={test_logo.src} />
            </div>
            <div className="flex flex-col flex-nowrap justify-between items-center">
                <BlockchainElement imageSource={test_logo.src} />
                <BlockchainElement imageSource={test_logo.src} />
            </div>
            <BlockchainElement imageSource={test_logo.src} />
            <div>ENSNodeLOGO</div>
        </div>
        <div className="flex flex-col flex-nowrap justify-between items-end w-1/4">
            <div>ENSNode</div>
            <h1>The new multichain indexer for ENSv2</h1>
        </div>
    </section>
}