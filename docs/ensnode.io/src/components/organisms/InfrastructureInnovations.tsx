import { BoltIcon } from "@workspace/docs/ensnode.io/src/components/atoms/icons/BoltIcon.tsx";
import { HeartIcon } from "@workspace/docs/ensnode.io/src/components/atoms/icons/HeartIcon.tsx";
import { LockIcon } from "@workspace/docs/ensnode.io/src/components/atoms/icons/LockIcon.tsx";
import { ENSAdminImage } from "@workspace/docs/ensnode.io/src/components/atoms/images/ENSAdminImage.tsx";
import { FasterLookupImage } from "@workspace/docs/ensnode.io/src/components/atoms/images/FasterLookupImage.tsx";
import { LostENSNamesImage } from "@workspace/docs/ensnode.io/src/components/atoms/images/LostENSNamesImage.tsx";
import { Fragment } from "react";
import { Balancer } from "react-wrap-balancer";
import ENSAdminDecentralizationMobileImage from "../../assets/Decentralization.png";
import InfrastructureGapsMobileImage from "../../assets/InfrustructureGaps.png";
import ProtocolInnovationsMobileImage from "../../assets/ProtocolInnovations.png";
import SectionDivider from "../atoms/SectionDivider.tsx";
import InnovationSection, { InnovationSectionProps } from "../molecules/InnovationSection.tsx";

export default function InfrastructureInnovations() {
  return (
    <>
      <Fragment key="Infrastructure-Innovations-Header">
        <div className="w-full h-fit flex flex-col justify-center items-center gap-5 px-5 sm:px-0 pt-10 sm:pt-[120px]">
          <h1 className="max-w-[720px] text-center text-black text-3xl sm:text-4xl leading-9 sm:leading-10 font-bold">
            ENSv2 Infrastructure Innovations
          </h1>
          <Balancer
            as="p"
            className="max-w-[720px] text-center text-gray-500 text-lg leading-8 sm:leading-7 font-normal"
          >
            Current ENS indexing cannot support the protocol's expansion beyond mainnet. A complete
            multi-chain solution is required for the ecosystem to thrive.
          </Balancer>
        </div>
      </Fragment>
      {innovationSections.map((section) => (
        <InnovationSection key={section.sectionHeader.toString().replace(" ", "-")} {...section} />
      ))}
      <SectionDivider />
    </>
  );
}

const innovationSections: InnovationSectionProps[] = [
  {
    sectionHeader: <>Close critical ENS infrastructure gaps</>,
    sectionDescription: (
      <>
        Indexed ENS data is vital for the upcoming launch of ENSv2 and Namechain. Existing ENS
        indexed data providers (the ENS Subgraph) are fundamentally unsuitable for ENSv2 and a
        replacement is critically required for many of ENS’s most important apps, including the
        official ENS Manager App among many others.
      </>
    ),
    badgeText: "Deliver vital ENSv2 infrastructure",
    badgeIcon: <HeartIcon className="w-[20px] h-[20px]" />,
    sectionBackground: "bg-white",
    isTextOnTheLeft: true,
    mobileImageOnTop: false,
    imageOnBottomForColumnLayout: true,
    svgImage: <LostENSNamesImage styles="relative z-10 w-full h-full" />,
    designatedMobileImage: <img src={InfrastructureGapsMobileImage.src} alt="lost names" />,
  },
  {
    sectionHeader: <>Strengthen the decentralization and &quot;unstoppability&quot; of ENS:</>,
    sectionDescription: (
      <>
        Our infrastructure under development removes a strict dependency on many centralized
        offchain gateway servers whose downtime would otherwise shut down impacted multichain ENS
        names that are key to the future of ENSv2 and Namechain, such as subnames of base.eth,
        linea.eth, or tokenized DNS names such as .box names or 3DNS names.
      </>
    ),
    badgeText: "Secure millions of ENS names from loss",
    badgeIcon: <LockIcon className="w-[20px] h-[20px]" />,
    sectionBackground: "bg-gray-50",
    isTextOnTheLeft: false,
    mobileImageOnTop: false,
    imageOnBottomForColumnLayout: true,
    svgImage: <ENSAdminImage styles="relative z-10 w-full h-full" />,
    designatedMobileImage: (
      <img src={ENSAdminDecentralizationMobileImage.src} alt="ENSAdmin decentralization" />
    ),
  },
  {
    sectionHeader: <>Deliver game-changing ENS protocol innovations</>,
    sectionDescription: (
      <>
        We are engineering radically accelerated resolution of most ENS queries. ENSNode’s
        architecture unlocks near-instant bulk resolution of live ENS records, including name
        resolution configurations that span across multiple chains.
      </>
    ),
    badgeText: "Encourage more big ENS integrations",
    badgeIcon: <BoltIcon className="w-[20px] h-[20px]" />,
    sectionBackground: "bg-white",
    isTextOnTheLeft: true,
    mobileImageOnTop: false,
    imageOnBottomForColumnLayout: true,
    svgImage: <FasterLookupImage styles="relative z-10 w-full h-full" />,
    designatedMobileImage: (
      <img src={ProtocolInnovationsMobileImage.src} alt="20 times faster lookup" />
    ),
  },
];
