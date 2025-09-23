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
import { CopyIcon } from "@/components/icons/CopyIcon";
import { HealIcon } from "@/components/icons/HealIcon";
import { IndexAdditionalRecordsIcon } from "@/components/icons/IndexAdditionalRecordsIcon";
import { IconENS } from "@/components/icons/ens";
import { ConfigInfoAppCard } from "@/components/indexing-status/config-info/app-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/tooltip";
import { CopyButton } from "@/components/ui/copy-button";
import { ErrorInfo, ErrorInfoProps } from "@/components/ui/error-info";
import { getChainName } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";
import { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import { ExternalLink, Replace } from "lucide-react";

/**
 * ENSNodeConfigInfo display variations:
 *
 * Standard - ensIndexerConfig: ENSIndexerPublicConfig, error: undefined
 * Loading - ensIndexerConfig: undefined, error: undefined
 * Error - ensIndexerConfig: undefined, error: ErrorInfoProps
 *
 * @throws If both ensIndexerConfig and error are defined
 */
export interface ENSNodeConfigProps {
  ensIndexerConfig?: ENSIndexerPublicConfig;
  error?: ErrorInfoProps;
}

export function ENSNodeConfigInfo({ ensIndexerConfig, error }: ENSNodeConfigProps) {
  const baseCardTitleStyles = "flex items-center gap-2";
  const cardContentStyles = "flex flex-col gap-4 max-sm:p-3";
  const cardItemValueStyles = "text-sm leading-6 font-normal text-black";

  if (error !== undefined && ensIndexerConfig !== undefined) {
    throw new Error("Invariant: ENSNodeConfigInfo with both ensIndexerConfig and error defined.");
  }

  if (error !== undefined) {
    return <ErrorInfo {...error} />;
  }

  if (ensIndexerConfig === undefined) {
    return <ENSNodeConfigInfoLoading />;
  }
  return (
    <Card className="w-full">
      <CardHeader className="sm:pb-4 max-sm:p-3">
        <CardTitle className={cn(baseCardTitleStyles, "text-2xl")}>
          <ENSNodeIcon width={28} height={28} />
          <span>ENSNode</span>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(cardContentStyles, "max-sm:pt-0")}>
        <div className="flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:gap-3">
          <div className="h-fit sm:min-w-[255px] flex flex-col justify-start items-start">
            <p className="text-sm leading-6 font-semibold text-gray-500">Connection</p>
            <p className="flex flex-row flex-nowrap justify-start items-center gap-[2px] text-sm leading-6 font-normal text-black">
              {ensIndexerConfig.ensNodePublicUrl.href}
              <CopyButton
                value={ensIndexerConfig.ensNodePublicUrl.href}
                icon={<CopyIcon />}
                className="max-sm:hidden"
              />
            </p>
          </div>
        </div>
        <div className={cn(cardContentStyles, "max-sm:gap-3 max-sm:p-0")}>
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
            docsLink={new URL("https://ensnode.io/ensadmin/")}
          />
          {/*ENSDb*/}
          <ConfigInfoAppCard
            name="ENSDb"
            icon={<ENSDbIcon width={24} height={24} />}
            items={[
              {
                label: "Database Schema",
                value: <p className={cardItemValueStyles}>{ensIndexerConfig.databaseSchemaName}</p>,
                additionalInfo: (
                  <p>
                    A Postgres database schema name. ENSIndexer writes indexed data to tables within
                    this schema.
                  </p>
                ),
              },
              {
                label: "Database",
                value: <p className={cardItemValueStyles}>Postgres</p>,
              },
            ]}
            version={ensIndexerConfig.dependencyInfo.ensRainbow}
            docsLink={new URL("https://ensnode.io/ensdb/")}
          />
          {/*It's safe to assume that the version number of ENSDb is always equal to the version number of ENSIndexer.
             Until changes to ENSIndexerPublicConfig are made this logic is correct (see a comment about ENSIndexer version)*/}
          {/*ENSIndexer*/}
          <ConfigInfoAppCard
            name="ENSIndexer"
            icon={<ENSIndexerIcon width={24} height={24} />}
            items={[
              {
                label: "Ponder",
                value: (
                  <p className={cardItemValueStyles}>{ensIndexerConfig.dependencyInfo.ponder}</p>
                ),
              },
              {
                label: "Node.js",
                value: (
                  <p className={cardItemValueStyles}>{ensIndexerConfig.dependencyInfo.nodejs}</p>
                ),
              },
              {
                label: "ENS Namespace",
                value: <p className={cardItemValueStyles}>{ensIndexerConfig.namespace}</p>,
                additionalInfo: <p>The ENS namespace that ENSNode operates in the context of.</p>,
              },
              {
                label: "Indexed Chains",
                value: (
                  <div className="flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-3 pt-1">
                    {Array.from(ensIndexerConfig.indexedChainIds).map((chainId) => (
                      <Tooltip key={`indexed-chain-#${chainId}`}>
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
                  <div className="w-full flex flex-row flex-nowrap max-[1100px]:flex-wrap justify-start items-start gap-1 pt-1">
                    {ensIndexerConfig.plugins.map((plugin) => (
                      <span
                        key={`${plugin}-plugin-badge`}
                        className="flex justify-start items-start py-[2px] px-[10px] rounded-full bg-secondary text-sm leading-normal font-semibold text-black cursor-default whitespace-nowrap"
                      >
                        {plugin}
                      </span>
                    ))}
                  </div>
                ),
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
                  descWhenTrue:
                    "ENSIndexer will track both the keys and the values of Resolver records.",
                  descWhenFalse:
                    "ENSIndexer will apply subgraph-backwards compatible logic that only tracks the keys of Resolver records.",
                },
                value: ensIndexerConfig.indexAdditionalResolverRecords,
                icon: <IndexAdditionalRecordsIcon className="flex-shrink-0" />,
              },
              {
                label: "Replace Unnormalized Labels",
                description: {
                  descWhenTrue:
                    "All Literal Labels and Literal Names encountered by ENSIndexer will be interpreted.",
                  descWhenFalse:
                    "ENSIndexer will store and return Literal Labels and Literal Names without further interpretation",
                },
                value: ensIndexerConfig.replaceUnnormalized,
                icon: <Replace width={20} height={20} stroke="#3F3F46" className="flex-shrink-0" />,
              },
              {
                label: "Subgraph Compatible",
                description: {
                  descWhenTrue:
                    "ENSIndexer is operating in a subgraph-compatible way. It will use subgraph-compatible IDs for entities and events and limit indexing behavior to subgraph indexing semantics",
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
                  <p className={cardItemValueStyles}>
                    {ensIndexerConfig.dependencyInfo.ensRainbowSchema}
                  </p>
                ),
              },
              {
                label: "LabelSetId",
                value: (
                  <p className={cardItemValueStyles}>{ensIndexerConfig.labelSet.labelSetId}</p>
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
                  <p className={cardItemValueStyles}>{ensIndexerConfig.labelSet.labelSetVersion}</p>
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

function ENSNodeConfigInfoLoading() {
  const loadingCardContentStyles = "space-y-2 max-sm:p-3 max-sm:pt-0";

  return (
    <Card className="animate-pulse">
      <CardHeader className="max-sm:p-3">
        <div className="h-6 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent className="max-sm:p-3 max-sm:pt-0">
        <div className="space-y-2 pb-6 max-sm:pb-3">
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
        <div className="flex flex-col gap-4 max-sm:p-0 max-sm:gap-3">
          {["ENSAdmin", "ENSDb", "ENSIndexer", "ENSRainbow"].map((app) => (
            <Card key={`${app}-app-placeholder`}>
              <CardHeader className="max-sm:p-3">
                <div className="h-6 bg-muted rounded w-1/4" />
              </CardHeader>
              <CardContent className={loadingCardContentStyles}>
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
