import SecondaryButtonIsland, {
  ButtonIslandProps,
} from "@workspace/docs/ensnode.io/src/components/atoms/SecondaryButtonIsland.tsx";
import { StarIcon } from "@workspace/docs/ensnode.io/src/components/atoms/icons/StarIcon.tsx";
import cc from "classcat";
import { Fragment } from "react";
import { Balancer } from "react-wrap-balancer";
import JoinTelegram from "../molecules/JoinTelegram.tsx";
import ENSAdmin3DImage from "../../assets/ENSAdmin3D.png";
import ENSIndexer3DImage from "../../assets/ENSIndexer3D.png";
import ENSRainbow3DImage from "../../assets/ENSRainbow3D.png";


const appsSuite: {
  visual: React.ReactNode;
  name: string;
  description: string;
  buttonData: ButtonIslandProps;
}[] = [
  {
    visual: <img src={ENSAdmin3DImage.src} alt="ENSAdmin" className="object-contain scale-125 sm:scale-[80%] lg:scale-150"/>,
    name: "ENSAdmin",
    description: "Explore the ENS protocol like never before",
    buttonData: {
      text: "View documentation",
      size: "medium",
      linkData: {
        link: "/ensadmin/",
        target: "_blank",
      },
    },
  },
  {
    visual: <img src={ENSIndexer3DImage.src} alt="ENSIndexer" className="object-contain scale-125 sm:scale-[80%] lg:scale-150"/>,
    name: "ENSIndexer",
    description: "Index multichain ENS data for ENSv2",
    buttonData: {
      text: "View documentation",
      size: "medium",
      linkData: {
        link: "/ensindexer/",
        target: "_blank",
      },
    },
  },
  {
    visual: <img src={ENSRainbow3DImage.src} alt="ENSRainbow" class="object-contain scale-125 sm:scale-[80%] lg:scale-150"/>,
    name: "ENSRainbow",
    description: 'Heal millions of "unknown" ENS names',
    buttonData: {
      text: "View documentation",
      size: "medium",
      linkData: {
        link: "/ensrainbow/",
        target: "_blank",
      },
    },
  },
];

export default function ENSNodeSuite() {
  const verticalDivStyles = "flex flex-col flex-nowrap justify-center items-center";
  return (
    <section className="w-full h-fit box-border flex flex-col flex-nowrap justify-center items-center gap-10 sm:gap-20 py-10 sm:py-20 px-5 sm:px-28">
      <div className="max-w-[1216px] w-full h-fit flex flex-col justify-center items-center gap-5">
        <span className="w-fit flex flex-row flex-nowrap justify-center items-center gap-2 px-4 py-2 rounded-[20px] border-gray-300 border">
          <StarIcon className="w-[20px] h-[20px]" />
          <p className="text-sm leading-5 font-medium text-center text-black">
            ENS Infrastructure Solutions
          </p>
        </span>
        <Balancer as="h1" className="max-w-[720px] text-center text-black text-3xl sm:text-4xl leading-9 sm:leading-10 font-bold">
          Introducing the ENSNode suite of apps
        </Balancer>
        <p className="max-w-[720px] text-center text-gray-500 text-lg leading-8 sm:leading-7 font-normal">
          Each ENSNode is powered by a suite of powerful apps that combine to deliver the future of
          ENS indexing and big enhancements to the ENS protocol.
        </p>
      </div>
      <div className="max-w-[1216px] h-fit w-full flex flex-col lg:flex-row flex-nowrap justify-center items-center gap-6">
        {appsSuite.map((namehashApp, idx) => (
          <Fragment key={`ensNodeApp-${namehashApp.name}`}>
            <div className={cc([verticalDivStyles, "gap-6 lg:max-h-[418px]"])}>
              <div className="w-full h-full max-h-[289px] max-sm:overflow-hidden flex justify-between items-center">
                {namehashApp.visual}
              </div>
              <div className={cc([verticalDivStyles, "gap-5"])}>
                <div className={cc([verticalDivStyles, "gap-2"])}>
                  <h3 className="self-stretch text-2xl leading-8 font-semibold text-black text-center">
                    {namehashApp.name}
                  </h3>
                  <Balancer className="text-gray-500 text-lg leading-7 font-normal text-center">
                    {namehashApp.description}
                  </Balancer>
                </div>
                <SecondaryButtonIsland
                  text={namehashApp.buttonData.text}
                  size={namehashApp.buttonData.size}
                  linkData={namehashApp.buttonData.linkData}
                />
              </div>
            </div>
            {idx < appsSuite.length - 1 && (
              <div className="flex items-center justify-center w-[100vw] sm:w-[calc(100vw-15px)] lg:w-[1px] max-lg:h-fit h-full">
                <span className="bg-gray-200 max-lg:h-[1px] h-[418px] max-lg:w-full w-[1px]"></span>
              </div>
            )}
          </Fragment>
        ))}
      </div>
      <JoinTelegram />
    </section>
  );
}
