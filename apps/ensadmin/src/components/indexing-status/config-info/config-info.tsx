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
import { ExternalLink, Replace } from "lucide-react";
import {HealIcon} from "@/components/icons/HealIcon";
import {IndexAdditionalRecordsIcon} from "@/components/icons/IndexAdditionalRecordsIcon";
import {ConnectionFailedIcon} from "@/components/icons/ConnectionFailedIcon";
import {CopyIcon} from "@/components/icons/CopyIcon";
import {ConfigInfoAppCard} from "@/components/indexing-status/config-info/app-card";

export interface ENSNodeConfigProps {
  ensIndexerConfig: ENSIndexerPublicConfig;
}

export function ENSNodeConfigInfo({ ensIndexerConfig }: ENSNodeConfigProps) {
  const baseCardTitleStyles = "flex items-center gap-2";
  const cardContentStyles = "flex flex-col gap-4";

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
              <CopyButton value={ensIndexerConfig.ensNodePublicUrl.href} icon={<CopyIcon />} />
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
            {/*TODO: The current approach to displaying the version of ENSAdmin is a stretch.
           We need to make another update that improves the data model of ENSIndexerPublicConfig and related */}
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
                    A Postgres database schema name. ENSIndexer writes indexed data to tables within this schema.
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
                        <span key={`${plugin}-plugin-badge`} className="flex justify-start items-start py-[2px] px-[10px] rounded-full bg-secondary text-sm leading-normal font-semibold text-black cursor-default">{plugin}</span>
                    ))}
                  </div>
                )
              },
            ]}
            checks={[
              {
                label: "Heal Reverse Addresses",
                description: {
                  descWhenTrue: "ENSIndexer will attempt to heal subnames of addr.reverse.",
                  descWhenFalse: "ENSIndexer won't attempt to heal subnames of addr.reverse.",
                },
                value: ensIndexerConfig.healReverseAddresses,
                icon: <HealIcon className="flex-shrink-0" />,
              },
              {
                label: "Index Additional Resolver Records",
                description: {
                  descWhenTrue: "ENSIndexer will track both the keys and the values of Resolver records.",
                  descWhenFalse: "ENSIndexer will apply subgraph-backwards compatible logic that only tracks the keys of Resolver records.",
                },
                value: ensIndexerConfig.indexAdditionalResolverRecords,
                icon: <IndexAdditionalRecordsIcon className="flex-shrink-0" />,
              },
              {
                label: "Replace Unnormalized Labels",
                description: {
                  descWhenTrue: "All Literal Labels and Literal Names encountered by ENSIndexer will be interpreted.",
                  descWhenFalse: "ENSIndexer will store and return Literal Labels and Literal Names without further interpretation",
                },
                value: ensIndexerConfig.replaceUnnormalized,
                icon: <Replace width={20} height={20} stroke="#3F3F46" className="flex-shrink-0" />,
              },
              {
                label: "Subgraph Compatible",
                description: {
                  descWhenTrue: "ENSIndexer is operating in a subgraph-compatible way. It will use subgraph-compatible IDs for entities and events and limit indexing behavior to subgraph indexing semantics",
                  descWhenFalse: "ENSIndexer is not operating in a subgraph-compatible way.",
                },
                value: ensIndexerConfig.isSubgraphCompatible,
                icon: <IconENS width={18} height={18} className="text-[#3F3F46] flex-shrink-0" />,
              },
            ]}
            version={ensIndexerConfig.dependencyInfo.ensRainbow}
            docsLink={new URL("https://ensnode.io/ensindexer/")}
          />
          {/*TODO: The current approach to displaying the version of ENSIndexer is a stretch.
           We need to make another update that improves the data model of ENSIndexerPublicConfig and related */}
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

export function ENSNodeConfigInfoError() {
    return (
        <section className="flex flex-col gap-6 p-6">
        <Card className="w-full">
            <CardHeader className="pb-2 max-sm:p-3">
                <CardTitle className="flex flex-row justify-start items-center gap-2 text-2xl"><ConnectionFailedIcon width={22} height={22} className="flex-shrink-0"/>Connection error</CardTitle>
            </CardHeader>
            <CardContent>Failed to fetch ENSIndexer Config.</CardContent>
        </Card>
        </section>
    );
}
