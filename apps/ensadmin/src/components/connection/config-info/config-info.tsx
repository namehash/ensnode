/**
 * This file describes UI components presenting information about
 * ENSNode's public configuration.
 */

"use client";

import { PlugZap, Replace } from "lucide-react";

import { type ENSApiPublicConfig, getENSRootChainId } from "@ensnode/ensnode-sdk";

import { ChainIcon } from "@/components/chains/ChainIcon";
import { ConfigInfoAppCard } from "@/components/connection/config-info/app-card";
import { CopyButton } from "@/components/copy-button";
import { ErrorInfo, type ErrorInfoProps } from "@/components/error-info";
import { ENSAdminIcon } from "@/components/icons/ensnode-apps/ensadmin-icon";
import { ENSDbIcon } from "@/components/icons/ensnode-apps/ensdb-icon";
import { ENSIndexerIcon } from "@/components/icons/ensnode-apps/ensindexer-icon";
import { ENSNodeIcon } from "@/components/icons/ensnode-apps/ensnode-icon";
import { ENSRainbowIcon } from "@/components/icons/ensnode-apps/ensrainbow-icon";
import { IconGraphNetwork } from "@/components/icons/graph-network";
import { HealIcon } from "@/components/icons/HealIcon";
import { IndexAdditionalRecordsIcon } from "@/components/icons/IndexAdditionalRecordsIcon";
import { ExternalLinkWithIcon } from "@/components/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";
import { getChainName } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";

/**
 * ENSNodeConfigInfo display variations:
 *
 * Standard - ensApiPublicConfig: ENSIndexerPublicConfig, error: undefined
 * Loading - ensApiPublicConfig: undefined, error: undefined
 * Error - ensApiPublicConfig: undefined, error: ErrorInfoProps
 *
 * @throws If both ensApiPublicConfig and error are defined
 */
export interface ENSNodeConfigProps {
  ensApiPublicConfig?: ENSApiPublicConfig;
  error?: ErrorInfoProps;
  ensAdminVersion?: string;
}

export function ENSNodeConfigInfo({
  ensApiPublicConfig,
  error,
  ensAdminVersion,
}: ENSNodeConfigProps) {
  const baseCardTitleStyles = "flex items-center gap-2 text-xl";
  const cardContentStyles = "flex flex-col gap-4 max-sm:p-3";
  const cardItemValueStyles = "text-sm leading-6 font-normal text-black";
  const { rawSelectedConnection } = useSelectedConnection();

  if (error !== undefined && ensApiPublicConfig !== undefined) {
    throw new Error("Invariant: ENSNodeConfigInfo with both ensApiPublicConfig and error defined.");
  }

  if (error !== undefined) {
    return <ErrorInfo {...error} />;
  }

  if (ensApiPublicConfig === undefined) {
    return <ENSNodeConfigInfoLoading />;
  }

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

  const ensRootChainId = getENSRootChainId(ensIndexerPublicConfig.namespace);

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
            {/*ENSApi*/}
            <ConfigInfoAppCard
              name="ENSApi"
              icon={<ENSAdminIcon width={24} height={24} />}
              items={[
                {
                  label: "Database",
                  value: <p className={cardItemValueStyles}>Postgres</p>,
                },
                {
                  label: "Database Schema",
                  value: (
                    <p className={cardItemValueStyles}>
                      {ensIndexerPublicConfig.databaseSchemaName}
                    </p>
                  ),
                  additionalInfo: (
                    <p>ENSApi reads from tables within this Postgres database schema.</p>
                  ),
                },
                {
                  label: "RPC Config",
                  value: (
                    <div className="flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-3 pt-1">
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">
                          <ChainIcon chainId={ensRootChainId} />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-gray-50 text-sm text-black text-center shadow-md outline-none w-fit"
                        >
                          {getChainName(ensRootChainId)}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ),
                },
              ]}
              version={ensApiPublicConfig.version}
              docsLink={new URL("https://ensnode.io/ensapi/")}
            />

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
                    <p className={cardItemValueStyles}>
                      {ensIndexerPublicConfig.databaseSchemaName}
                    </p>
                  ),
                  additionalInfo: (
                    <p>
                      ENSIndexer writes indexed data to tables within this Postgres database schema.
                    </p>
                  ),
                },
              ]}
              version={ensIndexerPublicConfig.versionInfo.ensDb}
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
                    <p className={cardItemValueStyles}>
                      {ensIndexerPublicConfig.versionInfo.nodejs}
                    </p>
                  ),
                  additionalInfo: (
                    <p>
                      Version of the{" "}
                      <ExternalLinkWithIcon
                        href={`https://nodejs.org/en/download/archive/v${ensIndexerPublicConfig.versionInfo.nodejs}`}
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
                    <p className={cardItemValueStyles}>
                      {ensIndexerPublicConfig.versionInfo.ponder}
                    </p>
                  ),
                  additionalInfo: (
                    <p>
                      Version of the{" "}
                      <ExternalLinkWithIcon
                        href={`https://www.npmjs.com/package/ponder/v/${ensIndexerPublicConfig.versionInfo.ponder}`}
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
                      {ensIndexerPublicConfig.versionInfo.ensNormalize}
                    </p>
                  ),
                  additionalInfo: (
                    <p>
                      Version of the{" "}
                      <ExternalLinkWithIcon
                        href={`https://www.npmjs.com/package/@adraffy/ens-normalize/v/${ensIndexerPublicConfig.versionInfo.ensNormalize}`}
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
                        {ensIndexerPublicConfig.labelSet.labelSetId}:
                        {ensIndexerPublicConfig.labelSet.labelSetVersion}
                      </li>
                    </ul>
                  ),
                  additionalInfo: (
                    <p>
                      The "fully pinned" labelset id and version used for deterministic healing of
                      unknown labels across time. The label set version may be equal to or less than
                      the highest label set version offered by the connected ENSRainbow server.{" "}
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
                  value: <p className={cardItemValueStyles}>{ensIndexerPublicConfig.namespace}</p>,
                  additionalInfo: <p>The ENS namespace that ENSNode operates in the context of.</p>,
                },
                {
                  label: "Indexed Chains",
                  value: (
                    <div className="flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-3 pt-1">
                      {Array.from(ensIndexerPublicConfig.indexedChainIds).map((chainId) => (
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
                      {ensIndexerPublicConfig.plugins.map((plugin) => (
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
                  icon: (
                    <IndexAdditionalRecordsIcon width={15} height={15} className="flex-shrink-0" />
                  ),
                },
                {
                  label: "Replace Unnormalized Labels",
                  description: replaceUnnormalizedLabelsDescription,
                  isActivated: replaceUnnormalizedLabelsActivated,
                  icon: (
                    <Replace width={15} height={15} stroke="#3F3F46" className="flex-shrink-0" />
                  ),
                },
                {
                  label: "Subgraph Compatibility",
                  description: subgraphCompatibilityDescription,
                  isActivated: subgraphCompatibilityActivated,
                  icon: (
                    <IconGraphNetwork
                      width={15}
                      height={15}
                      className="text-[#3F3F46] flex-shrink-0"
                    />
                  ),
                },
              ]}
              version={ensIndexerPublicConfig.versionInfo.ensIndexer}
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
                      {ensIndexerPublicConfig.labelSet.labelSetId}:
                      {ensIndexerPublicConfig.labelSet.labelSetVersion}
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
              version={ensIndexerPublicConfig.versionInfo.ensRainbow}
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
