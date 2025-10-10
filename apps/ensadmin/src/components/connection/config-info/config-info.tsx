/**
 * This file describes UI components presenting information about
 * ENSNode's public configuration.
 */

"use client";

import { ChainIcon } from "@/components/chains/ChainIcon";
import { ConfigInfoAppCard } from "@/components/connection/config-info/app-card";
import { CopyButton } from "@/components/copy-button";
import { ErrorInfo, ErrorInfoProps } from "@/components/error-info";
import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { HealIcon } from "@/components/icons/HealIcon";
import { IndexAdditionalRecordsIcon } from "@/components/icons/IndexAdditionalRecordsIcon";
import { IconENS } from "@/components/icons/ens";
import { ENSAdminIcon } from "@/components/icons/ensnode-apps/ensadmin-icon";
import { ENSDbIcon } from "@/components/icons/ensnode-apps/ensdb-icon";
import { ENSIndexerIcon } from "@/components/icons/ensnode-apps/ensindexer-icon";
import { ENSNodeIcon } from "@/components/icons/ensnode-apps/ensnode-icon";
import { ENSRainbowIcon } from "@/components/icons/ensnode-apps/ensrainbow-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";
import { getChainName } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";
import { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import { PlugZap, Replace } from "lucide-react";

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
  ensAdminVersion?: string;
}

export function ENSNodeConfigInfo({
  ensIndexerConfig,
  error,
  ensAdminVersion,
}: ENSNodeConfigProps) {
  const baseCardTitleStyles = "flex items-center gap-2 text-xl";
  const cardContentStyles = "flex flex-col gap-4 max-sm:p-3";
  const cardItemValueStyles = "text-sm leading-6 font-normal text-black";
  const { rawSelectedConnection } = useSelectedConnection();

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
    <div className="relative">
      {/*ENSAdmin*/}
      <ConfigInfoAppCard
        name="ENSAdmin"
        icon={<ENSAdminIcon width={28} height={28} />}
        version={ensAdminVersion}
        docsLink={new URL("https://ensnode.io/ensadmin/")}
      />

      <ConnectionLine />

      <ConfigInfoAppCard
        name="Connection"
        icon={<PlugZap className="size-7" />}
        items={[
          {
            label: "Selected Connection",
            value: (
              <span className="flex flex-row flex-no-wrap justify-start items-center gap-0.5 text-sm/6">
                {rawSelectedConnection}{" "}
                <CopyButton value={rawSelectedConnection} className="max-sm:hidden" />
              </span>
            ),
          },
        ]}
      />

      <ConnectionLine />

      <Card className="w-full">
        <CardHeader>
          <CardTitle className={baseCardTitleStyles}>
            <ENSNodeIcon width={28} height={28} />
            <span>ENSNode</span>
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(cardContentStyles, "max-sm:pt-0")}>
          <div className={cn(cardContentStyles, "max-sm:gap-3 max-sm:p-0")}>
            {/*ENSDb*/}
            <ConfigInfoAppCard
              name="ENSDb"
              icon={<ENSDbIcon width={24} height={24} />}
              items={[
                {
                  label: "Database",
                  value: <p className={cardItemValueStyles}>Postgres</p>,
                },
                {
                  label: "Database Schema",
                  value: (
                    <p className={cardItemValueStyles}>{ensIndexerConfig.databaseSchemaName}</p>
                  ),
                  additionalInfo: (
                    <p>
                      A Postgres database schema name. ENSIndexer writes indexed data to tables
                      within this schema.
                    </p>
                  ),
                },
              ]}
              version={ensIndexerConfig.versionInfo.ensDb}
              docsLink={new URL("https://ensnode.io/ensdb/")}
            />

            {/*ENSIndexer*/}
            <ConfigInfoAppCard
              name="ENSIndexer"
              icon={<ENSIndexerIcon width={24} height={24} />}
              items={[
                {
                  label: "Node.js",
                  value: (
                    <p className={cardItemValueStyles}>{ensIndexerConfig.versionInfo.nodejs}</p>
                  ),
                  additionalInfo: (
                    <p>
                      Version of the{" "}
                      <ExternalLinkWithIcon
                        href={`https://nodejs.org/en/download/archive/v${ensIndexerConfig.versionInfo.nodejs}`}
                      >
                        Node.js
                      </ExternalLinkWithIcon>{" "}
                      runtime.
                    </p>
                  ),
                },
                {
                  label: "Ponder",
                  value: (
                    <p className={cardItemValueStyles}>{ensIndexerConfig.versionInfo.ponder}</p>
                  ),
                  additionalInfo: (
                    <p>
                      Version of the{" "}
                      <ExternalLinkWithIcon
                        href={`https://www.npmjs.com/package/ponder/v/${ensIndexerConfig.versionInfo.ponder}`}
                      >
                        ponder
                      </ExternalLinkWithIcon>{" "}
                      package used for indexing onchain data.
                    </p>
                  ),
                },
                {
                  label: "ens-normalize.js",
                  value: (
                    <p className={cardItemValueStyles}>
                      {ensIndexerConfig.versionInfo.ensNormalize}
                    </p>
                  ),
                  additionalInfo: (
                    <p>
                      Version of the{" "}
                      <ExternalLinkWithIcon
                        href={`https://www.npmjs.com/package/@adraffy/ens-normalize/v/${ensIndexerConfig.versionInfo.ensNormalize}`}
                      >
                        @adraffy/ens-normalize
                      </ExternalLinkWithIcon>{" "}
                      package used for ENS name normalization.
                    </p>
                  ),
                },
                {
                  label: "Label Set",
                  value: (
                    <ul className={cardItemValueStyles}>
                      <li>
                        {ensIndexerConfig.labelSet.labelSetId}:{" "}
                        {ensIndexerConfig.labelSet.labelSetVersion}
                      </li>
                    </ul>
                  ),
                  additionalInfo: (
                    <p>
                      Versioning preferences of the ENSRainbow client.{" "}
                      <ExternalLinkWithIcon
                        href={`https://ensnode.io/ensrainbow/concepts/label-sets-and-versioning/#client-behavior`}
                      >
                        Learn
                      </ExternalLinkWithIcon>{" "}
                      how applications can choose between <strong>staying current</strong> with the
                      latest data or <strong>maintaining consistency</strong> for reproducible
                      results.
                    </p>
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
                    descWhenTrue: "ENSIndexer won't attempt to heal subnames of addr.reverse.",
                    descWhenFalse: "ENSIndexer will attempt to heal subnames of addr.reverse.",
                  },
                  value: ensIndexerConfig.isSubgraphCompatible,
                  icon: <HealIcon className="flex-shrink-0" />,
                },
                {
                  label: "Index Additional Resolver Records",
                  description: {
                    descWhenTrue: "ENSIndexer will only track the keys of Resolver records.",
                    descWhenFalse:
                      "ENSIndexer will track both the keys and the values of Resolver records.",
                  },
                  value: ensIndexerConfig.isSubgraphCompatible,
                  icon: <IndexAdditionalRecordsIcon className="flex-shrink-0" />,
                },
                {
                  label: "Replace Unnormalized Labels",
                  description: {
                    descWhenTrue:
                      "ENSIndexer will store and return Literal Labels and Literal Names without further interpretation",
                    descWhenFalse:
                      "All Literal Labels and Literal Names encountered by ENSIndexer will be interpreted.",
                  },
                  value: ensIndexerConfig.isSubgraphCompatible,
                  icon: (
                    <Replace width={20} height={20} stroke="#3F3F46" className="flex-shrink-0" />
                  ),
                },
                {
                  label: "Subgraph Compatible",
                  description: {
                    descWhenTrue:
                      "ENSIndexer is operating in a subgraph-compatible way. It will use subgraph-compatible IDs for entities and events and limit indexing behavior to subgraph indexing semantics",
                    descWhenFalse:
                      "ENSIndexer is not operating in a subgraph-compatible way and includes additional indexing enhancements.",
                  },
                  value: ensIndexerConfig.isSubgraphCompatible,
                  icon: <IconENS width={18} height={18} className="text-[#3F3F46] flex-shrink-0" />,
                },
              ]}
              version={ensIndexerConfig.versionInfo.ensIndexer}
              docsLink={new URL("https://ensnode.io/ensindexer/")}
            />

            {/*ENSRainbow*/}
            <ConfigInfoAppCard
              name="ENSRainbow"
              icon={<ENSRainbowIcon width={24} height={24} />}
              items={[
                {
                  label: "Schema Version",
                  value: (
                    <p className={cardItemValueStyles}>
                      {ensIndexerConfig.versionInfo.ensRainbowSchema}
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
                    <p className={cardItemValueStyles}>
                      {ensIndexerConfig.labelSet.labelSetVersion}
                    </p>
                  ),
                  additionalInfo: (
                    <p>
                      Optional highest label set version of label set id to query. Enables
                      deterministic heal results across time even if the ENSRainbow server ingests
                      label sets with greater versions than this value. If provided, only labels
                      from label sets with versions less than or equal to this value will be
                      returned. If not provided, the server will use the latest available version.
                    </p>
                  ),
                },
              ]}
              version={ensIndexerConfig.versionInfo.ensRainbow}
              docsLink={new URL("https://ensnode.io/ensrainbow/")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
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

function ConnectionLine() {
  return (
    <div className="relative h-10 pl-[38px]">
      <div className="w-0.5 h-full border-l-2 border-dashed border-blue-500 animate-pulse" />
    </div>
  );
}
