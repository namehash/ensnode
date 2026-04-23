/**
 * This file describes UI components presenting information about
 * ENSNode's public configuration.
 */

"use client";

import { ChainIcon, getChainName } from "@namehash/namehash-ui";
import { History, Replace } from "lucide-react";
import { Fragment, ReactNode } from "react";

import { EnsNodeStackInfo, getENSRootChainId } from "@ensnode/ensnode-sdk";

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
import { useEnsNodeStackInfo } from "@/hooks/use-ensnode-stack-info";
import { cn } from "@/lib/utils";

import {
  InfoCard,
  InfoCardConnector,
  InfoCardFeature,
  InfoCardFeatures,
  InfoCardItem,
  InfoCardItems,
} from "../shared/info-card";

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
          {index !== 0 && <InfoCardConnector />}

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
  ensNodeStackInfo: EnsNodeStackInfo;
}

/**
 * Display component that receives props - used for reusable/mockable presentation
 */
export function ENSNodeConfigCardDisplay({ ensNodeStackInfo }: ENSNodeConfigCardDisplayProps) {
  return (
    <ENSNodeCard>
      <ENSNodeConfigCardContent ensNodeStackInfo={ensNodeStackInfo} />
    </ENSNodeCard>
  );
}

/**
 * Props for ENSNodeConfigInfoView - internal component that accepts props for testing/mocking
 */
export interface ENSNodeConfigInfoViewProps {
  ensNodeStackInfo?: EnsNodeStackInfo;
  error?: ErrorInfoProps;
  isLoading?: boolean;
}

/**
 * Internal view component that accepts props - used by both the main component and mock pages
 */
export function ENSNodeConfigInfoView({
  ensNodeStackInfo,
  error,
  isLoading = false,
}: ENSNodeConfigInfoViewProps) {
  if (error) {
    return <ErrorInfo title={error.title} description={error.description} />;
  }

  // Show ENSNode card - shell with skeleton while loading, or content when ready
  if (isLoading || !ensNodeStackInfo) {
    return (
      <ENSNodeCard>
        <ENSNodeCardLoadingSkeleton />
      </ENSNodeCard>
    );
  }

  return <ENSNodeConfigCardDisplay ensNodeStackInfo={ensNodeStackInfo} />;
}

/**
 * ENSNodeConfigInfo component - fetches and displays ENSNode configuration data
 */
export function ENSNodeConfigInfo() {
  const ensNodeStackInfo = useEnsNodeStackInfo();

  if (ensNodeStackInfo.isError) {
    return (
      <ENSNodeConfigInfoView
        error={{
          title: "Error loading ENSNode Stack Info",
          description: ensNodeStackInfo.error.message,
        }}
      />
    );
  }

  if (ensNodeStackInfo.isPending) {
    return <ENSNodeConfigInfoView isLoading={true} />;
  }

  return <ENSNodeConfigInfoView ensNodeStackInfo={ensNodeStackInfo.data} />;
}

function ENSNodeConfigCardContent({ ensNodeStackInfo }: { ensNodeStackInfo: EnsNodeStackInfo }) {
  const cardItemValueStyles = "text-sm leading-6 font-normal text-black";

  const {
    ensApi: ensApiPublicConfig,
    ensIndexer: ensIndexerPublicConfig,
    ensDb: ensDbPublicConfig,
    ensRainbow: ensRainbowPublicConfig,
  } = ensNodeStackInfo;

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
      <ExternalLinkWithIcon href="https://ensnode.io/docs/reference/terminology#interpreted-label">
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
    <InfoCardFeature
      label="Heal Reverse Addresses"
      key="ENSIndexer Heal Reverse Addresses feature"
      description={healReverseAddressesDescription}
      icon={<HealIcon width={15} height={15} className="shrink-0" />}
    />
  );

  const indexAdditionalRecordsFeature = (
    <InfoCardFeature
      label="Index Additional Resolver Records"
      key="ENSIndexer Index Additional Resolver Records feature"
      description={indexAdditionalRecordsDescription}
      icon={<IndexAdditionalRecordsIcon width={15} height={15} className="shrink-0" />}
    />
  );

  const replaceUnnormalizedLabelsFeature = (
    <InfoCardFeature
      label="Replace Unnormalized Labels"
      key="ENSIndexer Replace Unnormalized Labels feature"
      description={replaceUnnormalizedLabelsDescription}
      icon={<Replace width={15} height={15} stroke="#3F3F46" className="shrink-0" />}
    />
  );

  const subgraphCompatabilityFeature = (
    <InfoCardFeature
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
      <InfoCard
        name="ENSApi"
        icon={<ENSApiIcon width={24} height={24} />}
        version={
          <p className="text-sm leading-normal font-normal text-muted-foreground">
            v{ensApiPublicConfig.versionInfo.ensApi}
          </p>
        }
        docsLink={new URL("https://ensnode.io/ensapi")}
      >
        <InfoCardItems>
          <InfoCardItem
            label="ENSIndexer Schema"
            value={
              <p className={cardItemValueStyles}>{ensIndexerPublicConfig.ensIndexerSchemaName}</p>
            }
            additionalInfo={
              <p>ENSApi reads indexed data from tables within this ENSIndexer Schema in ENSDb.</p>
            }
          />
          <InfoCardItem
            label="ENS Namespace"
            value={<p className={cardItemValueStyles}>{ensIndexerPublicConfig.namespace}</p>}
            additionalInfo={<p>The ENS namespace that ENSApi is operating in the context of.</p>}
          />
          <InfoCardItem
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
          <InfoCardItem
            label="ens-normalize.js"
            value={
              <p className={cardItemValueStyles}>{ensApiPublicConfig.versionInfo.ensNormalize}</p>
            }
            additionalInfo={
              <p>
                Version of the{" "}
                <ExternalLinkWithIcon
                  href={`https://www.npmjs.com/package/@adraffy/ens-normalize/v/${ensApiPublicConfig.versionInfo.ensNormalize}`}
                >
                  @adraffy/ens-normalize
                </ExternalLinkWithIcon>{" "}
                package used for ENS name normalization.
              </p>
            }
          />
        </InfoCardItems>
        <InfoCardFeatures activated={ensApiPublicConfig.theGraphFallback.canFallback}>
          <InfoCardFeature
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
        </InfoCardFeatures>
      </InfoCard>

      <InfoCardConnector />

      {/*ENSDb*/}
      <InfoCard
        name="ENSDb"
        icon={<ENSDbIcon width={24} height={24} />}
        version={
          <p className="text-sm leading-normal font-normal text-muted-foreground">
            v{ensIndexerPublicConfig.versionInfo.ensDb}
          </p>
        }
        docsLink={new URL("https://ensnode.io/ensdb")}
      >
        <InfoCardItems>
          <InfoCardItem
            label="Database server"
            value={
              <p className={cardItemValueStyles}>
                Postgres {ensDbPublicConfig.versionInfo.postgresql}
              </p>
            }
          />
          <InfoCardItem
            label="ENSIndexer Schema"
            value={
              <p className={cardItemValueStyles}>{ensIndexerPublicConfig.ensIndexerSchemaName}</p>
            }
            additionalInfo={
              <p>
                ENSDb enables devs to build custom services and APIs on top of indexed ENS data in
                this schema using{" "}
                <ExternalLinkWithIcon href="https://www.npmjs.com/package/@ensnode/ensdb-sdk">
                  ensdb-sdk
                </ExternalLinkWithIcon>
                .
              </p>
            }
          />
          <InfoCardItem
            label="ENSNode Schema"
            value={<p className={cardItemValueStyles}>ensnode</p>}
            additionalInfo={
              <p>This database schema stores Metadata about each ENSIndexer schema in ENSDb.</p>
            }
          />

          <InfoCardItem
            label="Ponder Schema"
            value={<p className={cardItemValueStyles}>ponder_sync</p>}
            additionalInfo={
              <p>
                Ponder manages this database schema to store cached RPC results and is shared across
                all ENSIndexer instances using this ENSDb.
              </p>
            }
          />
        </InfoCardItems>
      </InfoCard>

      <InfoCardConnector />

      {/*ENSIndexer*/}
      <InfoCard
        name="ENSIndexer"
        icon={<ENSIndexerIcon width={24} height={24} />}
        version={
          <p className="text-sm leading-normal font-normal text-muted-foreground">
            v{ensIndexerPublicConfig.versionInfo.ensIndexer}
          </p>
        }
        docsLink={new URL("https://ensnode.io/ensindexer")}
      >
        <InfoCardItems>
          <InfoCardItem
            label="ENSIndexer Schema"
            value={
              <p className={cardItemValueStyles}>{ensIndexerPublicConfig.ensIndexerSchemaName}</p>
            }
            additionalInfo={
              <p>
                ENSIndexer is the exclusive writer of indexed data to tables within this ENSIndexer
                Schema in ENSDb.
              </p>
            }
          />
          <InfoCardItem
            label="ENS Namespace"
            value={<p className={cardItemValueStyles}>{ensIndexerPublicConfig.namespace}</p>}
            additionalInfo={
              <p>The ENS namespace that ENSIndexer is operating in the context of.</p>
            }
          />
          <InfoCardItem
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
          <InfoCardItem
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
          <InfoCardItem
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
          <InfoCardItem
            label="Plugins"
            value={
              <div className="w-full flex flex-row flex-nowrap max-[1100px]:flex-wrap justify-start items-start gap-1 pt-1">
                {ensIndexerPublicConfig.plugins.map((plugin) => (
                  <span
                    key={`${plugin}-plugin-badge`}
                    className="flex justify-start items-start py-0.5 px-2.5 rounded-full bg-secondary text-sm leading-normal font-semibold text-black cursor-default whitespace-nowrap"
                  >
                    {plugin}
                  </span>
                ))}
              </div>
            }
          />
        </InfoCardItems>
        <InfoCardFeatures activated={true}>
          {ensIndexerFeatures
            .filter((feature) => feature.isActivated)
            .map((feature) => feature.feature)}
        </InfoCardFeatures>
        <InfoCardFeatures activated={false}>
          {ensIndexerFeatures
            .filter((feature) => !feature.isActivated)
            .map((feature) => feature.feature)}
        </InfoCardFeatures>
        <InfoCardItems>
          <InfoCardItem
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
                  href={`https://ensnode.io/ensrainbow/concepts/label-sets-and-versioning#client-behavior`}
                >
                  Learn more.
                </ExternalLinkWithIcon>
              </p>
            }
          />
        </InfoCardItems>
      </InfoCard>

      <InfoCardConnector />

      {/*ENSRainbow*/}
      <InfoCard
        name="ENSRainbow"
        icon={<ENSRainbowIcon width={24} height={24} />}
        version={
          <p className="text-sm leading-normal font-normal text-muted-foreground">
            v{ensIndexerPublicConfig.ensRainbowPublicConfig.version}
          </p>
        }
        docsLink={new URL("https://ensnode.io/ensrainbow")}
      >
        <InfoCardItems>
          <InfoCardItem
            label="Server LabelSet"
            value={
              <p className={cardItemValueStyles}>
                {ensIndexerPublicConfig.ensRainbowPublicConfig.labelSet.labelSetId}:
                {ensIndexerPublicConfig.ensRainbowPublicConfig.labelSet.highestLabelSetVersion}
              </p>
            }
            additionalInfo={
              <p>
                The labelset id and highest labelset version offered by the ENSRainbow server.{" "}
                <ExternalLinkWithIcon
                  href={`https://ensnode.io/ensrainbow/concepts/label-sets-and-versioning`}
                >
                  Learn more.
                </ExternalLinkWithIcon>
              </p>
            }
          />

          <InfoCardItem
            label="Records Count"
            value={
              <p className={cardItemValueStyles}>
                {ensIndexerPublicConfig.ensRainbowPublicConfig.recordsCount.toLocaleString()}
              </p>
            }
            additionalInfo={
              <p>
                The total number of Rainbow Records.{" "}
                <ExternalLinkWithIcon
                  href={`https://ensnode.io/ensrainbow/concepts/glossary#rainbow-record`}
                >
                  Learn more.
                </ExternalLinkWithIcon>
              </p>
            }
          />
        </InfoCardItems>
      </InfoCard>
    </div>
  );
}
