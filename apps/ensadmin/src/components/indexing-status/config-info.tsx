/**
 * This file describes UI components presenting information about
 * ENSNode's public configuration.
 */

import { ChainIcon } from "@/components/chains/ChainIcon";
import { ENSAdminIcon } from "@/components/ensadmin-icon";
import { ENSDbIcon } from "@/components/ensdb-icon";
import { ENSIndexerIcon } from "@/components/ensindexer-icon";
import { ENSNodeIcon } from "@/components/ensnode-icon";
import { ENSRainbowIcon } from "@/components/ensrainbow-icon";
import { IconENS } from "@/components/icons/ens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getChainName } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";
import { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import { CheckIcon, ExternalLink, Replace, X } from "lucide-react";
import { ReactElement, SVGProps } from "react";

export interface ENSNodeConfigProps {
  ensIndexerConfig: ENSIndexerPublicConfig;
}

//TODO: At the very end -> clean up the code by separating Icons & utils to new files
export function ENSNodeConfigInfo({ ensIndexerConfig }: ENSNodeConfigProps) {
  const baseCardTitleStyles = "flex items-center gap-2";
  const cardContentStyles = "flex flex-col gap-4";
  const copyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <g clipPath="url(#clip0_899_10241)">
        <path
          d="M2.66536 10.6666C1.93203 10.6666 1.33203 10.0666 1.33203 9.33325V2.66659C1.33203 1.93325 1.93203 1.33325 2.66536 1.33325H9.33203C10.0654 1.33325 10.6654 1.93325 10.6654 2.66659M6.66536 5.33325H13.332C14.0684 5.33325 14.6654 5.93021 14.6654 6.66659V13.3333C14.6654 14.0696 14.0684 14.6666 13.332 14.6666H6.66536C5.92899 14.6666 5.33203 14.0696 5.33203 13.3333V6.66659C5.33203 5.93021 5.92899 5.33325 6.66536 5.33325Z"
          stroke="#737373"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_899_10241">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 max-sm:p-3">
        <CardTitle className={cn(baseCardTitleStyles, "text-2xl")}>
          <ENSNodeIcon width={28} height={28} />
          <span>ENSNode</span>
        </CardTitle>
      </CardHeader>
      <CardContent className={cardContentStyles}>
        <div className="flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:gap-3">
          <div className="h-fit min-w-[255px] flex flex-col justify-start items-start">
            <p className="text-sm leading-6 font-semibold text-gray-500">Connection</p>
            <p className="flex flex-row flex-nowrap justify-start items-center gap-[2px] text-sm leading-6 font-normal text-black">
              {ensIndexerConfig.ensNodePublicUrl.href}
              <CopyButton value={ensIndexerConfig.ensNodePublicUrl.href} icon={copyIcon} />
            </p>
          </div>
        </div>
        <div className={cn(cardContentStyles, "max-sm:gap-3")}>
          {/*ENSAdmin*/}
          <ConfigInfoAppCard
            name="ENSAdmin"
            icon={<ENSAdminIcon width={24} height={24} />}
            items={[
              {
                label: "URL",
                value: (
                  <a
                    href={ensIndexerConfig.ensAdminUrl.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline text-sm leading-6 font-normal"
                  >
                    {ensIndexerConfig.ensAdminUrl.href}
                    <ExternalLink size={14} className="inline-block" />
                  </a>
                ),
              },
            ]}
            version={ensIndexerConfig.dependencyInfo.ensRainbow}
            docsLink={new URL("https://ensnode.io/ensadmin/")}
          />
          {/*TODO: The version of ensindexer/ensadmin is a stretch, idk if we can be sure that the versions are aligned, PROBABLY NOT */}
          {/*ENSDb*/}
          <ConfigInfoAppCard
            name="ENSDb"
            icon={<ENSDbIcon width={24} height={24} />}
            items={[
              {
                label: "Database Schema",
                value: (
                  <p className="text-sm leading-6 font-normal text-black">
                    {ensIndexerConfig.databaseSchemaName}
                  </p>
                ),
                additionalInfo: (
                  <p>
                    A Postgres database schema name. This instance of ENSIndexer will write indexed
                    data to the tables in this schema.
                  </p>
                ),
              },
            ]}
            version="ClosedAlpha"
          />
          {/*ENSIndexer*/}
          <ConfigInfoAppCard
            name="ENSIndexer"
            icon={<ENSIndexerIcon width={24} height={24} />}
            items={[
              {
                label: "Ponder",
                value: (
                  <p className="text-sm leading-6 font-normal text-black">
                    {ensIndexerConfig.dependencyInfo.ponder}
                  </p>
                ),
              },
              {
                label: "Node.js",
                value: (
                  <p className="text-sm leading-6 font-normal text-black">
                    {ensIndexerConfig.dependencyInfo.nodejs}
                  </p>
                ),
              },
              {
                label: "ENS Namespace",
                value: (
                  <p className="text-sm leading-6 font-normal text-black">
                    {ensIndexerConfig.namespace}
                  </p>
                ),
                additionalInfo: <p>The ENS namespace that ENSNode operates in the context of.</p>,
              },
              {
                label: "Indexed Chains",
                value: (
                  <div className="flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-3 pt-1">
                    {Array.from(ensIndexerConfig.indexedChainIds).map((chainId) => (
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">
                          <ChainIcon key={`indexed-chain-${chainId}-icon`} chainId={chainId} />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-gray-50 text-sm text-black text-center shadow-md outline-none w-fit"
                        >
                          {getChainName(chainId)}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ),
              },
              {
                label: "Plugins",
                value: (
                  <div className="w-full flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-1 pt-1">
                    {ensIndexerConfig.plugins.map((plugin) => (
                      <PluginBadge key={`${plugin}-plugin-badge`} text={plugin} />
                    ))}
                  </div>
                )
              },
            ]}
            checks={[
              {
                label: "Heal Reverse Addresses",
                description: {
                  checkSelected: "Check is TRUE",
                  checkNotSelected: "Check is FALSE",
                },
                value: ensIndexerConfig.healReverseAddresses,
                icon: <HealIcon className="flex-shrink-0" />,
              },
              {
                label: "Index Additional Resolver Records",
                description: {
                  checkSelected: "Check is TRUE",
                  checkNotSelected: "Check is FALSE",
                },
                value: ensIndexerConfig.indexAdditionalResolverRecords,
                icon: <IndexAdditionalRecordsIcon className="flex-shrink-0" />,
              },
              {
                label: "Replace Unnormalized Labels",
                description: {
                  checkSelected: "Check is TRUE",
                  checkNotSelected: "Check is FALSE",
                },
                value: ensIndexerConfig.replaceUnnormalized,
                icon: <Replace width={20} height={20} stroke="#3F3F46" className="flex-shrink-0" />,
              },
              {
                label: "Subgraph Compatible",
                description: {
                  checkSelected: "Check is TRUE",
                  checkNotSelected: "Check is FALSE",
                },
                value: ensIndexerConfig.isSubgraphCompatible,
                icon: <IconENS width={18} height={18} className="text-[#3F3F46] flex-shrink-0" />,
              },
            ]}
            version={ensIndexerConfig.dependencyInfo.ensRainbow}
            docsLink={new URL("https://ensnode.io/ensindexer/")}
          />
          {/*TODO: The version of ensindexer is a stretch, idk if we can be sure that the versions are aligned, PROBABLY NOT */}
          {/*ENSRainbow*/}
          <ConfigInfoAppCard
            name="ENSRainbow"
            icon={<ENSRainbowIcon width={24} height={24} />}
            items={[
              {
                label: "Schema Version",
                value: (
                  <p className="text-sm leading-6 font-normal text-black">
                    {ensIndexerConfig.dependencyInfo.ensRainbowSchema}
                  </p>
                ),
              },
              {
                label: "LabelSetId",
                value: (
                  <p className="text-sm leading-6 font-normal text-black">
                    {ensIndexerConfig.labelSet.labelSetId}
                  </p>
                ),
                additionalInfo: (
                  <p>
                    Optional label set ID that the ENSRainbow server is expected to use. If
                    provided, heal operations will validate the ENSRainbow server is using this
                    labelSetId.
                  </p>
                ),
              },
              {
                label: "Highest label set version",
                value: (
                  <p className="text-sm leading-6 font-normal text-black">
                    {ensIndexerConfig.labelSet.labelSetVersion}
                  </p>
                ),
                additionalInfo: (
                  <p>
                    Optional highest label set version of label set id to query. Enables
                    deterministic heal results across time even if the ENSRainbow server ingests
                    label sets with greater versions than this value. If provided, only labels from
                    label sets with versions less than or equal to this value will be returned. If
                    not provided, the server will use the latest available version.
                  </p>
                ),
              },
            ]}
            version={ensIndexerConfig.dependencyInfo.ensRainbow}
            docsLink={new URL("https://ensnode.io/ensrainbow/")}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface ConfigInfoAppCardContent {
  label: string;
  value: ReactElement;
  additionalInfo?: ReactElement;
}

interface ConfigInfoAppCardProps {
  name: string;
  icon: ReactElement;
  items: ConfigInfoAppCardContent[];
  version: string;
  docsLink?: URL;
  checks?: {
    label: string;
    description: {
      //TODO: improve field names here
      checkSelected: string;
      checkNotSelected: string;
    };
    value: boolean;
    icon: ReactElement;
  }[];
}

interface TextContentProps {
  text: string;
}

const PluginBadge = ({ text }: TextContentProps) => (
  <span className="flex justify-start items-start py-[2px] px-[10px] rounded-full bg-secondary text-sm leading-normal font-semibold text-black cursor-default">
    {text}
  </span>
);

interface TooltipContentProps {
  content: ReactElement;
}
const AdditionalInformationTooltip = ({ content }: TooltipContentProps) => {
  const InfoIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      className="cursor-pointer flex-shrink-0"
    >
      <g clipPath="url(#clip0_876_7239)">
        <path
          d="M8.2487 10.6666V7.99992M8.2487 5.33325H8.25536M14.9154 7.99992C14.9154 11.6818 11.9306 14.6666 8.2487 14.6666C4.5668 14.6666 1.58203 11.6818 1.58203 7.99992C1.58203 4.31802 4.5668 1.33325 8.2487 1.33325C11.9306 1.33325 14.9154 4.31802 14.9154 7.99992Z"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_876_7239">
          <rect width="16" height="16" fill="white" transform="translate(0.25)" />
        </clipPath>
      </defs>
    </svg>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>{InfoIcon}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-gray-50 text-sm text-black shadow-md outline-none max-w-[275px]"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
};

const ConfigInfoAppCard = ({
  name,
  icon,
  items,
  version,
  docsLink,
  checks,
}: ConfigInfoAppCardProps) => {
  const cardHeaderLayoutStyles =
    "flex flex-row flex-nowrap justify-between items-center max-sm:flex-col max-sm:justify-start max-sm:items-start max-sm:gap-2";
  const baseCardTitleStyles = "flex items-center gap-2";
  const cardContentStyles = "flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:gap-3";

  return (
    <Card>
      <CardHeader className="pb-5">
        <div className={cardHeaderLayoutStyles}>
          <CardTitle className={cn(baseCardTitleStyles, "text-lg leading-normal font-semibold")}>
            {icon}
            <span>{name}</span>
          </CardTitle>
          <div className={baseCardTitleStyles}>
            <p className="text-sm leading-normal font-normal text-muted-foreground">v{version}</p>
            {docsLink && (
              <a
                href={docsLink.href}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 text-sm leading-normal text-blue-600 hover:underline font-normal"
              >
                View Docs <ExternalLink size={14} className="inline-block" />
              </a>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cardContentStyles}>
        {items.map((item) => (
          <div
            key={`${name}-${item.label}-item`}
            className="h-fit sm:min-w-[255px] flex flex-col justify-start items-start"
          >
            <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-sm leading-6 font-semibold text-gray-500">
              {item.label}
              {item.additionalInfo && (
                <AdditionalInformationTooltip content={item.additionalInfo} />
              )}
            </p>
            {item.value}
          </div>
        ))}
      </CardContent>
      {checks && (
        <CardContent className={cardContentStyles}>
          <span className="w-full self-stretch h-[1px] bg-gray-300" />
          <div className="flex flex-col justify-start items-start gap-2">
            <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-md leading-normal font-semibold text-black">
              Settings
            </p>
            {checks.map((check) => (
              <div
                key={`${name}-${check.label}-check`}
                className="flex flex-row flex-nowrap justify-start items-center gap-2"
              >
                {check.icon}
                <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-sm leading-6 font-semibold text-gray-500">
                  {check.label}
                  <AdditionalInformationTooltip
                    content={
                      <p>
                        {check.value
                          ? check.description.checkSelected
                          : check.description.checkNotSelected}
                      </p>
                    }
                  />
                </p>
                {check.value ? (
                  <CheckIcon className="text-emerald-600 flex-shrink-0" />
                ) : (
                  <X className="text-red-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const HealIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="21"
    height="20"
    viewBox="0 0 21 20"
    fill="none"
    {...props}
  >
    <path
      d="M7.4364 7.08341L13.5614 12.9167M9.18641 17.0834L17.9364 8.75008C18.3453 8.36848 18.6706 7.91346 18.8937 7.41135C19.1168 6.90924 19.2331 6.36999 19.236 5.82479C19.2389 5.27959 19.1283 4.73925 18.9106 4.23501C18.6928 3.73078 18.3723 3.27266 17.9675 2.88714C17.5627 2.50162 17.0817 2.19635 16.5522 1.98898C16.0228 1.78161 15.4554 1.67625 14.883 1.67901C14.3105 1.68176 13.7443 1.79257 13.2171 2.00502C12.6899 2.21747 12.2121 2.52736 11.8114 2.91675L3.0614 11.2501C2.65254 11.6317 2.32716 12.0867 2.10409 12.5888C1.88101 13.0909 1.76467 13.6302 1.76177 14.1754C1.75888 14.7206 1.8695 15.2609 2.08724 15.7652C2.30498 16.2694 2.62552 16.7275 3.03031 17.113C3.43511 17.4986 3.91614 17.8038 4.44558 18.0112C4.97503 18.2186 5.54238 18.3239 6.11484 18.3212C6.68731 18.3184 7.25352 18.2076 7.78073 17.9951C8.30795 17.7827 8.78572 17.4728 9.18641 17.0834Z"
      stroke="#3F3F46"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IndexAdditionalRecordsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    {...props}
  >
    <path
      d="M17.5 4.16675C17.5 5.54746 14.1421 6.66675 10 6.66675C5.85786 6.66675 2.5 5.54746 2.5 4.16675M17.5 4.16675C17.5 2.78604 14.1421 1.66675 10 1.66675C5.85786 1.66675 2.5 2.78604 2.5 4.16675M17.5 4.16675L17.5 9.00012M2.5 4.16675L2.50006 15.8334C2.49541 16.2342 2.77989 16.6294 3.3295 16.9859C3.87911 17.3423 4.67774 17.6495 5.65809 17.8815C6.63843 18.1135 7.77174 18.2636 8.96248 18.319C10.1532 18.3745 11.3665 18.3337 12.5001 18.2001M16.5 13.0001V17.0335M2.5 10.0001C2.5012 10.3897 2.77557 10.7738 3.30121 11.1218C3.82685 11.4698 4.58921 11.772 5.52747 12.0043C6.46573 12.2367 7.5539 12.3927 8.70518 12.46C9.85645 12.5272 11.039 12.5039 12.1583 12.3917M14.5 15.0001H18.5"
      stroke="#3F3F46"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function ENSNodeConfigError() {
    //TODO: transfer to distinct file & make bigger here
    const connectionFailedIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
                                      fill="none">
        <g clipPath="url(#clip0_978_13386)">
            <path
                d="M7.9987 5.33301V7.99967M7.9987 10.6663H8.00536M14.6654 7.99967C14.6654 11.6816 11.6806 14.6663 7.9987 14.6663C4.3168 14.6663 1.33203 11.6816 1.33203 7.99967C1.33203 4.31778 4.3168 1.33301 7.9987 1.33301C11.6806 1.33301 14.6654 4.31778 14.6654 7.99967Z"
                stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
            <clipPath id="clip0_978_13386">
                <rect width="16" height="16" fill="white"/>
            </clipPath>
        </defs>
    </svg>
    return (
        <Card className="w-full">
            <CardHeader className="pb-2 max-sm:p-3">
                <CardTitle className="flex flex-row justify-start items-center gap-2 text-2xl">Error {connectionFailedIcon}</CardTitle>
            </CardHeader>
            <CardContent>Failed to fetch ENSIndexer Config.</CardContent>
        </Card>
    );
}

