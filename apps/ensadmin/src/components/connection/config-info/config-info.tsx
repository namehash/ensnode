/**
 * This file describes UI components presenting information about
 * ENSNode's public configuration.
 */

"use client";

import { ChainIcon } from "@namehash/namehash-ui";
import { History, Replace } from "lucide-react";
import { Fragment, ReactNode } from "react";

import { useENSNodeConfig } from "@ensnode/ensnode-react";
import { type ENSApiPublicConfig, getENSRootChainId } from "@ensnode/ensnode-sdk";

import {
  ConfigInfoAppCard,
  ConfigInfoFeature,
  ConfigInfoFeatures,
  ConfigInfoItem,
  ConfigInfoItems,
} from "@/components/connection/config-info/app-card";
import { ConnectionLine } from "@/components/connection-line";
import { ErrorInfo, type ErrorInfoProps } from "@/components/error-info";
import { ENSApiIcon } from "@/components/icons/ensnode-apps/ensapi-icon";
import { ENSDbIcon } from "@/components/icons/ensnode-apps/ensdb-icon";
import { ENSIndexerIcon } from "@/components/icons/ensnode-apps/ensindexer-icon";
import { ENSNodeIcon } from "@/components/icons/ensnode-apps/ensnode-icon";
import { ENSRainbowIcon } from "@/components/icons/ensnode-apps/ensrainbow-icon";
import { IconGraphNetwork } from "@/components/icons/graph-network";
import { HealIcon } from "@/components/icons/HealIcon";
import { IndexAdditionalRecordsIcon } from "@/components/icons/IndexAdditionalRecordsIcon";
import { ExternalLinkWithIcon } from "@/components/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getChainName } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";

/**
 * Reusable ENSNode card wrapper that provides consistent header and accepts children content
 */
export interface ENSNodeCardProps {
  children: ReactNode;
}

export function ENSNodeCard({ children }: ENSNodeCardProps) {
  const cardContentStyles = "flex flex-col gap-4 max-sm:p-3";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ENSNodeIcon width={28} height={28} />
          <span>ENSNode</span>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(cardContentStyles, "max-sm:pt-0")}>{children}</CardContent>
    </Card>
  );
}

/**
 * Loading skeleton content for ENSNodeCard
 */
function ENSNodeCardLoadingSkeleton() {
  const cardContentStyles = "flex flex-col gap-4 max-sm:p-3";

  return (
    <div className={cn(cardContentStyles, "max-sm:gap-3 max-sm:p-0 gap-0")}>
      {["ENSApi", "ENSDb", "ENSIndexer", "ENSRainbow"].map((app, index) => (
        <Fragment key={`${app}-loading`}>
          {index !== 0 && <ConnectionLine />}

          <Card className="animate-pulse">
            <CardHeader className="max-sm:p-3">
              <div className="h-6 bg-muted rounded-sm w-1/3" />
            </CardHeader>
            <CardContent className="space-y-3 max-sm:p-3 max-sm:pt-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Props for ENSNodeConfigCardDisplay - display component that accepts props for testing/mocking
 */
export interface ENSNodeConfigCardDisplayProps {
  ensApiPublicConfig: ENSApiPublicConfig;
}

/**
 * Display component that receives props - used for reusable/mockable presentation
 */
export function ENSNodeConfigCardDisplay({ ensApiPublicConfig }: ENSNodeConfigCardDisplayProps) {
  return (
    <ENSNodeCard>
      <ENSNodeConfigCardContent ensApiPublicConfig={ensApiPublicConfig} />
    </ENSNodeCard>
  );
}

/**
 * Props for ENSNodeConfigInfoView - internal component that accepts props for testing/mocking
 */
export interface ENSNodeConfigInfoViewProps {
  ensApiPublicConfig?: ENSApiPublicConfig;
  error?: ErrorInfoProps;
  isLoading?: boolean;
}

/**
 * Internal view component that accepts props - used by both the main component and mock pages
 */
export function ENSNodeConfigInfoView({
  ensApiPublicConfig,
  error,
  isLoading = false,
}: ENSNodeConfigInfoViewProps) {
  if (error) {
    return <ErrorInfo title={error.title} description={error.description} />;
  }

  // Show ENSNode card - shell with skeleton while loading, or content when ready
  if (isLoading || !ensApiPublicConfig) {
    return (
      <ENSNodeCard>
        <ENSNodeCardLoadingSkeleton />
      </ENSNodeCard>
    );
  }

  return <ENSNodeConfigCardDisplay ensApiPublicConfig={ensApiPublicConfig} />;
}

/**
 * ENSNodeConfigInfo component - fetches and displays ENSNode configuration data
 */
export function ENSNodeConfigInfo() {
  const ensNodeConfigQuery = useENSNodeConfig();

  return (
    <ENSNodeConfigInfoView
      ensApiPublicConfig={ensNodeConfigQuery.isSuccess ? ensNodeConfigQuery.data : undefined}
      error={
        ensNodeConfigQuery.isError
          ? {
              title: "ENSNodeConfigInfo Error",
              description: ensNodeConfigQuery.error.message,
            }
          : undefined
      }
      isLoading={ensNodeConfigQuery.isPending}
    />
  );
}

function ENSNodeConfigCardContent({
  ensApiPublicConfig,
}: {
  ensApiPublicConfig: ENSApiPublicConfig;
}) {
  const cardItemValueStyles = "text-sm leading-6 font-normal text-black";

  const { ensIndexerPublicConfig } = ensApiPublicConfig;

  const healReverseAddressesActivated = !ensIndexerPublicConfig.isSubgraphCompatible;
  const indexAdditionalRecordsActivated = !ensIndexerPublicConfig.isSubgraphCompatible;
  const replaceUnnormalizedLabelsActivated = !ensIndexerPublicConfig.isSubgraphCompatible;
  const subgraphCompatibilityActivated = ensIndexerPublicConfig.isSubgraphCompatible;

  const healReverseAddressesDescription = healReverseAddressesActivated ? (
    <p>Subnames of addr.reverse will all be known (healed) labels.</p>
  ) : (
    <p>Subnames of addr.reverse will generally be unknown labels.</p>
  );

  const indexAdditionalRecordsDescription = indexAdditionalRecordsActivated ? (
    <p>
      The keys and values of all onchain resolver records will be indexed across all indexed chains.
    </p>
  ) : (
    <p>
      Only the keys (generally none of the values) of onchain resolver records will be indexed
      across all indexed chains.
    </p>
  );

  const replaceUnnormalizedLabelsDescription = replaceUnnormalizedLabelsActivated ? (
    <p>
      All labels and names that ENSIndexer stores in ENSDb will meet the strong guarantees of
      "Interpreted Labels" and "Interpreted Names". Therefore apps integrating with this ENSNode
      don't need to worry about receiving unnormalized labels from ENSNode that are not encoded
      labelhashes.{" "}
      <ExternalLinkWithIcon href="https://ensnode.io/docs/reference/terminology/#interpreted-label">
        Learn more.
      </ExternalLinkWithIcon>
    </p>
  ) : (
    <p>
      All labels and names that ENSIndexer stores in ENSDb will meet the loose guarantees of
      "Subgraph Interpreted Labels" and "Subgraph Interpreted Names". Therefore apps integrating
      with this ENSNode need to worry about receiving unnormalized labels and names from ENSNode.
    </p>
  );

  const subgraphCompatibilityDescription = subgraphCompatibilityActivated ? (
    <p>
      ENSIndexer is operating in a subgraph-compatible way. It will use subgraph-compatible IDs for
      entities and events and limit indexing behavior to subgraph indexing semantics.
    </p>
  ) : (
    <p>
      ENSIndexer has activated feature enhancements and/or plugins that provide key benefits but are
      not fully backwards compatible with the ENS Subgraph.
    </p>
  );

  const healReverseAddressesFeature = (
    <ConfigInfoFeature
      label="Heal Reverse Addresses"
      key="ENSIndexer Heal Reverse Addresses feature"
      description={healReverseAddressesDescription}
      icon={<HealIcon width={15} height={15} className="shrink-0" />}
    />
  );

  const indexAdditionalRecordsFeature = (
    <ConfigInfoFeature
      label="Index Additional Resolver Records"
      key="ENSIndexer Index Additional Resolver Records feature"
      description={indexAdditionalRecordsDescription}
      icon={<IndexAdditionalRecordsIcon width={15} height={15} className="shrink-0" />}
    />
  );

  const replaceUnnormalizedLabelsFeature = (
    <ConfigInfoFeature
      label="Replace Unnormalized Labels"
      key="ENSIndexer Replace Unnormalized Labels feature"
      description={replaceUnnormalizedLabelsDescription}
      icon={<Replace width={15} height={15} stroke="#3F3F46" className="shrink-0" />}
    />
  );

  const subgraphCompatabilityFeature = (
    <ConfigInfoFeature
      label="Subgraph Compatibility"
      key="ENSIndexer Subgraph Compatibility feature"
      description={subgraphCompatibilityDescription}
      icon={<IconGraphNetwork width={15} height={15} className="text-[#3F3F46] shrink-0" />}
    />
  );

  const ensIndexerFeatures = [
    {
      isActivated: healReverseAddressesActivated,
      feature: healReverseAddressesFeature,
    },
    {
      isActivated: indexAdditionalRecordsActivated,
      feature: indexAdditionalRecordsFeature,
    },
    {
      isActivated: replaceUnnormalizedLabelsActivated,
      feature: replaceUnnormalizedLabelsFeature,
    },
    {
      isActivated: subgraphCompatibilityActivated,
      feature: subgraphCompatabilityFeature,
    },
  ];

  const ensRootChainId = getENSRootChainId(ensIndexerPublicConfig.namespace);

  return (
    <div className="relative">
      {/*ENSApi*/}
      <ConfigInfoAppCard
        name="ENSApi"
        icon={<ENSApiIcon width={24} height={24} />}
        version={
          <p className="text-sm leading-normal font-normal text-muted-foreground">
            v{ensApiPublicConfig.version}
          </p>
        }
        docsLink={new URL("https://ensnode.io/ensapi/")}
      >
        <ConfigInfoItems>
          <ConfigInfoItem
            label="Database"
            value={<p className={cardItemValueStyles}>Postgres</p>}
          />
          <ConfigInfoItem
            label="Database Schema"
            value={
              <p className={cardItemValueStyles}>{ensIndexerPublicConfig.databaseSchemaName}</p>
            }
            additionalInfo={
              <p>ENSApi reads indexed data from tables within this Postgres database schema.</p>
            }
          />
          <ConfigInfoItem
            label="ENS Namespace"
            value={<p className={cardItemValueStyles}>{ensIndexerPublicConfig.namespace}</p>}
            additionalInfo={<p>The ENS namespace that ENSApi is operating in the context of.</p>}
          />
          <ConfigInfoItem
            label="RPC Config"
            value={
              <div className="flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-3 pt-1">
                <Tooltip>
                  <TooltipTrigger className="cursor-default">
                    <ChainIcon chainId={ensRootChainId} />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-gray-50 text-sm text-black text-center shadow-md outline-hidden w-fit"
                  >
                    {getChainName(ensRootChainId)}
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            additionalInfo={
              <p>
                This ENS Root Chain RPC is used to power the Resolution API, in situations where
                Protocol Acceleration is not possible.
              </p>
            }
          />
        </ConfigInfoItems>
        <ConfigInfoFeatures activated={ensApiPublicConfig.theGraphFallback.canFallback}>
          <ConfigInfoFeature
            label="Subgraph API Fallback"
            description={
              ensApiPublicConfig.theGraphFallback.canFallback ? (
                <p>
                  ENSApi's Subgraph API (/subgraph) will automatically fallback to The Graph if the
                  connected ENSIndexer is not sufficiently &quot;realtime&quot;.
                </p>
              ) : (
                <p>
                  ENSApi's Subgraph API (/subgraph) will NOT fallback to The Graph if the connected
                  ENSIndexer is not sufficiently &quot;realtime&quot;. {(() => {
                    switch (ensApiPublicConfig.theGraphFallback.reason) {
                      case "not-subgraph-compatible":
                        return "The connected ENSIndexer is not Subgraph Compatible.";
                      case "no-api-key":
                        return "No API key for The Graph is configured.";
                      case "no-subgraph-url":
                        return "The Graph does not provide an ENS Subgraph for the configured ENS Namespace.";
                      default:
                        return null;
                    }
                  })()}
                </p>
              )
            }
            icon={<History width={15} height={15} className="shrink-0" />}
          />
        </ConfigInfoFeatures>
      </ConfigInfoAppCard>

      <ConnectionLine />

      {/*ENSDb*/}
      <ConfigInfoAppCard
        name="ENSDb"
        icon={<ENSDbIcon width={24} height={24} />}
        version={
          <p className="text-sm leading-normal font-normal text-muted-foreground">
            v{ensIndexerPublicConfig.versionInfo.ensDb}
          </p>
        }
        docsLink={new URL("https://ensnode.io/ensdb/")}
      >
        <ConfigInfoItems>
          <ConfigInfoItem
            label="Database"
            value={<p className={cardItemValueStyles}>Postgres</p>}
          />
          <ConfigInfoItem
            label="Database Schema"
            value={
              <p className={cardItemValueStyles}>{ensIndexerPublicConfig.databaseSchemaName}</p>
            }
            additionalInfo={
              <p>ENSIndexer writes indexed data to tables within this Postgres database schema.</p>
            }
          />
        </ConfigInfoItems>
      </ConfigInfoAppCard>

      <ConnectionLine />

      {/*ENSIndexer*/}
      <ConfigInfoAppCard
        name="ENSIndexer"
        icon={<ENSIndexerIcon width={24} height={24} />}
        version={
          <p className="text-sm leading-normal font-normal text-muted-foreground">
            v{ensIndexerPublicConfig.versionInfo.ensIndexer}
          </p>
        }
        docsLink={new URL("https://ensnode.io/ensindexer/")}
      >
        <ConfigInfoItems>
          <ConfigInfoItem
            label="Database"
            value={<p className={cardItemValueStyles}>Postgres</p>}
          />
          <ConfigInfoItem
            label="Database Schema"
            value={
              <p className={cardItemValueStyles}>{ensIndexerPublicConfig.databaseSchemaName}</p>
            }
            additionalInfo={
              <p>ENSIndexer writes indexed data to tables within this Postgres database schema.</p>
            }
          />
          <ConfigInfoItem
            label="ENS Namespace"
            value={<p className={cardItemValueStyles}>{ensIndexerPublicConfig.namespace}</p>}
            additionalInfo={
              <p>The ENS namespace that ENSIndexer is operating in the context of.</p>
            }
          />
          <ConfigInfoItem
            label="Indexed Chains"
            value={
              <div className="flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-3 pt-1">
                {Array.from(ensIndexerPublicConfig.indexedChainIds).map((chainId) => (
                  <Tooltip key={`indexed-chain-#${chainId}`}>
                    <TooltipTrigger className="cursor-default">
                      <ChainIcon chainId={chainId} />
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-gray-50 text-sm text-black text-center shadow-md outline-hidden w-fit"
                    >
                      {getChainName(chainId)}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            }
          />
          <ConfigInfoItem
            label="Node.js"
            value={
              <p className={cardItemValueStyles}>{ensIndexerPublicConfig.versionInfo.nodejs}</p>
            }
            additionalInfo={
              <p>
                Version of the{" "}
                <ExternalLinkWithIcon
                  href={`https://nodejs.org/en/download/archive/v${ensIndexerPublicConfig.versionInfo.nodejs}`}
                >
                  Node.js
                </ExternalLinkWithIcon>{" "}
                runtime.
              </p>
            }
          />
          <ConfigInfoItem
            label="Ponder"
            value={
              <p className={cardItemValueStyles}>{ensIndexerPublicConfig.versionInfo.ponder}</p>
            }
            additionalInfo={
              <p>
                Version of the{" "}
                <ExternalLinkWithIcon
                  href={`https://www.npmjs.com/package/ponder/v/${ensIndexerPublicConfig.versionInfo.ponder}`}
                >
                  ponder
                </ExternalLinkWithIcon>{" "}
                package used for indexing onchain data.
              </p>
            }
          />
          <ConfigInfoItem
            label="ens-normalize.js"
            value={
              <p className={cardItemValueStyles}>
                {ensIndexerPublicConfig.versionInfo.ensNormalize}
              </p>
            }
            additionalInfo={
              <p>
                Version of the{" "}
                <ExternalLinkWithIcon
                  href={`https://www.npmjs.com/package/@adraffy/ens-normalize/v/${ensIndexerPublicConfig.versionInfo.ensNormalize}`}
                >
                  @adraffy/ens-normalize
                </ExternalLinkWithIcon>{" "}
                package used for ENS name normalization.
              </p>
            }
          />
          <ConfigInfoItem
            label="Plugins"
            value={
              <div className="w-full flex flex-row flex-nowrap max-[1100px]:flex-wrap justify-start items-start gap-1 pt-1">
                {ensIndexerPublicConfig.plugins.map((plugin) => (
                  <span
                    key={`${plugin}-plugin-badge`}
                    className="flex justify-start items-start py-[2px] px-[10px] rounded-full bg-secondary text-sm leading-normal font-semibold text-black cursor-default whitespace-nowrap"
                  >
                    {plugin}
                  </span>
                ))}
              </div>
            }
          />
        </ConfigInfoItems>
        <ConfigInfoFeatures activated={true}>
          {ensIndexerFeatures
            .filter((feature) => feature.isActivated)
            .map((feature) => feature.feature)}
        </ConfigInfoFeatures>
        <ConfigInfoFeatures activated={false}>
          {ensIndexerFeatures
            .filter((feature) => !feature.isActivated)
            .map((feature) => feature.feature)}
        </ConfigInfoFeatures>
        <ConfigInfoItems>
          <ConfigInfoItem
            label="Client LabelSet"
            value={
              <ul className={cardItemValueStyles}>
                <li>
                  {ensIndexerPublicConfig.labelSet.labelSetId}:
                  {ensIndexerPublicConfig.labelSet.labelSetVersion}
                </li>
              </ul>
            }
            additionalInfo={
              <p>
                The "fully pinned" labelset id and version used for deterministic healing of unknown
                labels across time. The label set version may be equal to or less than the highest
                label set version offered by the connected ENSRainbow server.{" "}
                <ExternalLinkWithIcon
                  href={`https://ensnode.io/ensrainbow/concepts/label-sets-and-versioning/#client-behavior`}
                >
                  Learn more.
                </ExternalLinkWithIcon>
              </p>
            }
          />
        </ConfigInfoItems>
      </ConfigInfoAppCard>

      <ConnectionLine />

      {/*ENSRainbow*/}
      <ConfigInfoAppCard
        name="ENSRainbow"
        icon={<ENSRainbowIcon width={24} height={24} />}
        version={
          <p className="text-sm leading-normal font-normal text-muted-foreground">
            v{ensIndexerPublicConfig.versionInfo.ensRainbow}
          </p>
        }
        docsLink={new URL("https://ensnode.io/ensrainbow/")}
      >
        <ConfigInfoItems>
          <ConfigInfoItem
            label="Server LabelSet"
            value={
              <p className={cardItemValueStyles}>
                {ensIndexerPublicConfig.labelSet.labelSetId}:
                {ensIndexerPublicConfig.labelSet.labelSetVersion}
              </p>
            }
            additionalInfo={
              <p>
                The labelset id and highest labelset version offered by the ENSRainbow server.{" "}
                <ExternalLinkWithIcon
                  href={`https://ensnode.io/ensrainbow/concepts/label-sets-and-versioning/`}
                >
                  Learn more.
                </ExternalLinkWithIcon>
              </p>
            }
          />
        </ConfigInfoItems>
      </ConfigInfoAppCard>
    </div>
  );
}
