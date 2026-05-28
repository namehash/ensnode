import { AnticaptureLogo } from "@components/atoms/logos/ens-ecosystem-members/AnticaptureLogo";
import { AtlasLogo } from "@components/atoms/logos/ens-ecosystem-members/AtlasLogo";
import { BlockfulLogo } from "@components/atoms/logos/ens-ecosystem-members/BlockfulLogo";
import { EnscribeLogo } from "@components/atoms/logos/ens-ecosystem-members/EnscribeLogo";
import { ENSLabsLogo } from "@components/atoms/logos/ens-ecosystem-members/ENSLabsLogo";
import { ENSTestEnvLogo } from "@components/atoms/logos/ens-ecosystem-members/ENSTestEnvLogo";
import { ENSv2AppLogo } from "@components/atoms/logos/ens-ecosystem-members/ENSv2AppLogo";
import { ENSv2ExplorerLogo } from "@components/atoms/logos/ens-ecosystem-members/ENSv2ExplorerLogo";
import { ENSVisionLogo } from "@components/atoms/logos/ens-ecosystem-members/ENSVisionLogo";
import { ENSvolutionLogo } from "@components/atoms/logos/ens-ecosystem-members/ENSvolutionLogo";
import { EthereumCommentsProtocolLogo } from "@components/atoms/logos/ens-ecosystem-members/EthereumCommentsProtocolLogo";
import { EthIdLogo } from "@components/atoms/logos/ens-ecosystem-members/EthIdLogo";
import { GrailsLogo } from "@components/atoms/logos/ens-ecosystem-members/GrailsLogo";
import { JustaNameLogo } from "@components/atoms/logos/ens-ecosystem-members/JustaNameLogo";
import { NamespaceLogo } from "@components/atoms/logos/ens-ecosystem-members/NamespaceLogo";
import type { JSX } from "react";

export const EnsEcosystemMemberTypes = {
  organization: "organization",
  app: "app",
} as const;

export type EnsEcosystemMemberType =
  (typeof EnsEcosystemMemberTypes)[keyof typeof EnsEcosystemMemberTypes];

export interface ENSEcosystemMemberDisplayData {
  name: string;
  websiteURL: URL;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  customStyles?: string;
}

export const ENS_ECOSYSTEM_MEMBERS = new Map<
  EnsEcosystemMemberType,
  ENSEcosystemMemberDisplayData[]
>([
  [
    EnsEcosystemMemberTypes.organization,
    [
      {
        name: "ENS Labs",
        websiteURL: new URL("https://www.enslabs.org/"),
        icon: ENSLabsLogo,
      },
      {
        name: "Ethereum Identity Foundation",
        websiteURL: new URL("https://ethid.org/"),
        icon: EthIdLogo,
      },
      {
        name: "Blockful",
        websiteURL: new URL("https://www.blockful.io/"),
        icon: BlockfulLogo,
      },
      {
        name: "Namespace",
        websiteURL: new URL("https://www.namespace.ninja/"),
        icon: NamespaceLogo,
      },
      {
        name: "JustaName",
        websiteURL: new URL("https://www.justaname.id/"),
        icon: JustaNameLogo,
        customStyles:
          "text-white opacity-50 group-hover:opacity-100 transition-opacity duration-200",
      },
      {
        name: "Enscribe",
        websiteURL: new URL("https://www.enscribe.xyz/"),
        icon: EnscribeLogo,
      },
      {
        name: "Ethereum Comments Protocol",
        websiteURL: new URL("https://www.ethcomments.xyz/"),
        icon: EthereumCommentsProtocolLogo,
      },
    ],
  ],
  [
    EnsEcosystemMemberTypes.app,
    [
      {
        name: "Official ENSv2 Explorer",
        websiteURL: new URL("https://explorer.ens.dev/"),
        icon: ENSv2ExplorerLogo,
      },
      {
        name: "Official ENSv2 App",
        websiteURL: new URL("https://app.ens.dev/"),
        icon: ENSv2AppLogo,
      },
      {
        name: "Grails",
        websiteURL: new URL("https://grails.app/"),
        icon: GrailsLogo,
      },
      {
        name: "ENS Vision",
        websiteURL: new URL("https://ensvision.com/"),
        icon: ENSVisionLogo,
      },
      {
        name: "Anticapture",
        websiteURL: new URL("https://app.anticapture.com/"),
        icon: AnticaptureLogo,
      },
      {
        name: "ENSvolution",
        websiteURL: new URL("https://www.ensvolution.xyz/"),
        icon: ENSvolutionLogo,
        customStyles: "py-0.5 sm:py-1",
      },
      {
        name: "ens-test-env",
        websiteURL: new URL("https://github.com/ensdomains/ens-test-env"),
        icon: ENSTestEnvLogo,
      },
      {
        name: "Atlas (ENS CLI)",
        websiteURL: new URL("https://github.com/stevedylandev/atlas"),
        icon: AtlasLogo,
        customStyles: "py-1 sm:py-2",
      },
    ],
  ],
]);
