/**
 * This file describes UI components presenting information about
 * ENSNode's public configuration.
 */

"use client";

import { ChainIcon } from "@/components/chains/ChainIcon";
import { ConfigInfoAppCard } from "@/components/connection/config-info/app-card";
import { ErrorInfo } from "@/components/error-info";
import { HealIcon } from "@/components/icons/HealIcon";
import { IndexAdditionalRecordsIcon } from "@/components/icons/IndexAdditionalRecordsIcon";
import { ENSDbIcon } from "@/components/icons/ensnode-apps/ensdb-icon";
import { ENSIndexerIcon } from "@/components/icons/ensnode-apps/ensindexer-icon";
import { ENSNodeIcon } from "@/components/icons/ensnode-apps/ensnode-icon";
import { ENSRainbowIcon } from "@/components/icons/ensnode-apps/ensrainbow-icon";
import { IconGraphNetwork } from "@/components/icons/graph-network";
import { ExternalLinkWithIcon } from "@/components/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getChainName } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";
import { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import { Replace } from "lucide-react";
import { ReactNode } from "react";

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
    <div className={cn(cardContentStyles, "max-sm:gap-3 max-sm:p-0")}>
      {["ENSDb", "ENSIndexer", "ENSRainbow"].map((app) => (
        <Card key={`${app}-loading`} className="animate-pulse">
          <CardHeader className="max-sm:p-3">
            <div className="h-6 bg-muted rounded w-1/3" />
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
      ))}
    </div>
  );
}

/**
 * Props for ENSNodeConfigCardDisplay - display component that accepts props for testing/mocking
 */
export interface ENSNodeConfigCardDisplayProps {
  ensIndexerConfig: ENSIndexerPublicConfig;
}

/**
 * Display component that receives props - used for reusable/mockable presentation
 */
export function ENSNodeConfigCardDisplay({ ensIndexerConfig }: ENSNodeConfigCardDisplayProps) {
  return (
    <ENSNodeCard>
      <ENSNodeConfigCardContent ensIndexerConfig={ensIndexerConfig} />
    </ENSNodeCard>
  );
}

/**
 * Props for ENSNodeConfigInfoView - internal component that accepts props for testing/mocking
 */
export interface ENSNodeConfigInfoViewProps {
  ensIndexerConfig?: ENSIndexerPublicConfig;
  error?: {
    title: string;
    description: string;
  };
  isLoading?: boolean;
}

/**
 * Internal view component that accepts props - used by both the main component and mock pages
 */
export function ENSNodeConfigInfoView({
  ensIndexerConfig,
  error,
  isLoading = false,
}: ENSNodeConfigInfoViewProps) {
  if (error) {
    return <ErrorInfo title={error.title} description={error.description} />;
  }

  // Show ENSNode card - shell with skeleton while loading, or content when ready
  if (isLoading || !ensIndexerConfig) {
    return (
      <ENSNodeCard>
        <ENSNodeCardLoadingSkeleton />
      </ENSNodeCard>
    );
  }

  return <ENSNodeConfigCardDisplay ensIndexerConfig={ensIndexerConfig} />;
}

/**
 * ENSNodeConfigInfo component - fetches and displays ENSNode configuration data
 */
export function ENSNodeConfigInfo() {
  const ensIndexerConfigQuery = useENSIndexerConfig();

  return (
    <ENSNodeConfigInfoView
      ensIndexerConfig={ensIndexerConfigQuery.isSuccess ? ensIndexerConfigQuery.data : undefined}
      error={
        ensIndexerConfigQuery.isError
          ? {
              title: "ENSNodeConfigInfo Error",
              description: ensIndexerConfigQuery.error.message,
            }
          : undefined
      }
      isLoading={ensIndexerConfigQuery.isPending}
    />
  );
}

function ENSNodeConfigCardContent({
  ensIndexerConfig,
}: {
  ensIndexerConfig: ENSIndexerPublicConfig;
}) {
  const cardItemValueStyles = "text-sm leading-6 font-normal text-black";

  const healReverseAddressesActivated = !ensIndexerConfig.isSubgraphCompatible;
  const indexAdditionalRecordsActivated = !ensIndexerConfig.isSubgraphCompatible;
  const replaceUnnormalizedLabelsActivated = !ensIndexerConfig.isSubgraphCompatible;
  const subgraphCompatibilityActivated = ensIndexerConfig.isSubgraphCompatible;

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

  return (
    <>
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
            value: <p className={cardItemValueStyles}>{ensIndexerConfig.databaseSchemaName}</p>,
            additionalInfo: (
              <p>ENSIndexer writes indexed data to tables within this Postgres database schema.</p>
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
            value: <p className={cardItemValueStyles}>{ensIndexerConfig.versionInfo.nodejs}</p>,
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
            value: <p className={cardItemValueStyles}>{ensIndexerConfig.versionInfo.ponder}</p>,
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
              <p className={cardItemValueStyles}>{ensIndexerConfig.versionInfo.ensNormalize}</p>
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
            label: "Client LabelSet",
            value: (
              <ul className={cardItemValueStyles}>
                <li>
                  {ensIndexerConfig.labelSet.labelSetId}:{ensIndexerConfig.labelSet.labelSetVersion}
                </li>
              </ul>
            ),
            additionalInfo: (
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
        features={[
          {
            label: "Heal Reverse Addresses",
            description: healReverseAddressesDescription,
            isActivated: healReverseAddressesActivated,
            icon: <HealIcon width={15} height={15} className="flex-shrink-0" />,
          },
          {
            label: "Index Additional Resolver Records",
            description: indexAdditionalRecordsDescription,
            isActivated: indexAdditionalRecordsActivated,
            icon: <IndexAdditionalRecordsIcon width={15} height={15} className="flex-shrink-0" />,
          },
          {
            label: "Replace Unnormalized Labels",
            description: replaceUnnormalizedLabelsDescription,
            isActivated: replaceUnnormalizedLabelsActivated,
            icon: <Replace width={15} height={15} stroke="#3F3F46" className="flex-shrink-0" />,
          },
          {
            label: "Subgraph Compatibility",
            description: subgraphCompatibilityDescription,
            isActivated: subgraphCompatibilityActivated,
            icon: (
              <IconGraphNetwork width={15} height={15} className="text-[#3F3F46] flex-shrink-0" />
            ),
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
            label: "Server LabelSet",
            value: (
              <p className={cardItemValueStyles}>
                {ensIndexerConfig.labelSet.labelSetId}:{ensIndexerConfig.labelSet.labelSetVersion}
              </p>
            ),
            additionalInfo: (
              <p>
                The labelset id and highest labelset version offered by the ENSRainbow server.{" "}
                <ExternalLinkWithIcon
                  href={`https://ensnode.io/ensrainbow/concepts/label-sets-and-versioning/`}
                >
                  Learn more.
                </ExternalLinkWithIcon>
              </p>
            ),
          },
        ]}
        version={ensIndexerConfig.versionInfo.ensRainbow}
        docsLink={new URL("https://ensnode.io/ensrainbow/")}
      />
    </>
  );
}
