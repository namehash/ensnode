import SecondaryButtonIsland, {
  ButtonIslandProps,
} from "@workspace/docs/ensnode.io/src/components/atoms/SecondaryButtonIsland.tsx";
import { StarIcon } from "@workspace/docs/ensnode.io/src/components/atoms/icons/StarIcon.tsx";
import cc from "classcat";
import ENSAdminVisual from "../../assets/4 1.png";
import JoinTelegram from "../molecules/JoinTelegram.tsx";

const appsSuite: {
  visual: React.ReactNode;
  name: string;
  description: string;
  buttonData: ButtonIslandProps;
}[] = [
  {
    visual: <img alt="ENSAdmin" src={ENSAdminVisual.src} />,
    name: "ENSAdmin",
    description: "Explore the ENS protocol like never before",
    buttonData: {
      text: "View documentation",
      size: "medium",
      linkData: {
        link: "",
        target: "_blank",
      },
    },
  },
  {
    visual: <img alt="ENSIndexer" src={ENSAdminVisual.src} />,
    name: "ENSIndexer",
    description: "Index multichain ENS data for ENS",
    buttonData: {
      text: "View documentation",
      size: "medium",
      linkData: {
        link: "",
        target: "_blank",
      },
    },
  },
  {
    visual: <img alt="ENSRainbow" src={ENSAdminVisual.src} />,
    name: "ENSRainbow",
    description: 'Heal millions of "unknown" ENS names',
    buttonData: {
      text: "View documentation",
      size: "medium",
      linkData: {
        link: "",
        target: "_blank",
      },
    },
  },
];

export default function ENSNodeSuite() {
  const verticalDivStyles = "flex flex-col flex-nowrap justify-center items-center";
  return (
    <section class="flex flex-col flex-nowrap justify-center items-center gap-20 py-20 px-28">
      <div class="w-full h-fit flex flex-col justify-center items-center gap-5">
        <span class="w-fit flex flex-row flex-nowrap justify-center items-center gap-2 px-4 py-2 rounded-[20px] border-gray-300 border">
          <StarIcon className="w-[20px] h-[20px]" />
          <p class="text-sm leading-5 font-medium text-center text-black">
            ENS Infrastructure Solutions
          </p>
        </span>
        <h1 class="max-w-[720px] text-center text-black text-4xl leading-10 font-bold">
          Introducing the ENSNode suite of apps
        </h1>
        <p class="max-w-[720px] text-center text-gray-500 text-lg leading-7 font-normal">
          Each ENSNode is powered by a suite of powerful apps that combine to deliver the future of
          ENS indexing and big enhancements to the ENS protocol.
        </p>
      </div>
      <div className="h-full w-full flex flex-col sm:flex-row flex-nowrap justify-center items-center gap-6">
        {appsSuite.map((namehashApp, idx) => (
          <>
            <div
              className={cc([
                verticalDivStyles,
                "gap-6",
                idx < appsSuite.length - 1 ? "border-r border-gray-200 pr-6" : "",
              ])}
            >
              {namehashApp.visual}
              <div className={cc([verticalDivStyles, "gap-5"])}>
                <div className={cc([verticalDivStyles, "gap-2"])}>
                  <h3 className="self-stretch text-2xl leading-8 font-semibold text-black text-center">
                    {namehashApp.name}
                  </h3>
                  <p className="text-gray-500 text-lg leading-7 font-normal text-center">
                    {namehashApp.description}
                  </p>
                </div>
                <SecondaryButtonIsland
                  text={namehashApp.buttonData.text}
                  size={namehashApp.buttonData.size}
                  linkData={namehashApp.buttonData.linkData}
                />
              </div>
            </div>
          </>
        ))}
      </div>
      <JoinTelegram />
    </section>
  );
}
