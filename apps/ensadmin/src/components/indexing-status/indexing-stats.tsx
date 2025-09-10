/**
 * This file describes UI components for each of {@link OverallIndexingStatusId}.
 *
 * Each overall status will enable presenting of different indexing stats.
 */

import { ChainIcon } from "@/components/chains/ChainIcon";
import { ChainName } from "@/components/chains/ChainName";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChainIndexingStatusIds,
  ENSIndexerOverallIndexingBackfillStatus,
  ENSIndexerOverallIndexingCompletedStatus,
  ENSIndexerOverallIndexingFollowingStatus,
  ENSIndexerOverallIndexingStatus,
  ENSIndexerOverallIndexingUnstartedStatus,
  OverallIndexingStatusId,
  OverallIndexingStatusIds,
  sortAscChainStatusesByStartBlock,
} from "@ensnode/ensnode-sdk";
import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";
import { BlockStats, blockViewModel } from "./block-refs";

interface IndexingStatusProps<IndexingStatusType extends ENSIndexerOverallIndexingStatus> {
  indexingStatus: IndexingStatusType;
}

/**
 * Indexing stats for {@link OverallIndexingStatusIds.IndexerError}.
 */
export function IndexingStatsForIndexerErrorStatus() {
  return (
    <p>
      It appears that the indexing of new blocks has been interrupted. API requests to this ENSNode
      should continue working successfully but may serve data that isn't updated to the latest
      onchain state.
    </p>
  );
}

/**
 * Indexing stats for {@link OverallIndexingStatusIds.Unstarted}.
 */
export function IndexingStatsForUnstartedStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingUnstartedStatus>) {
  const chainEntries = sortAscChainStatusesByStartBlock([...indexingStatus.chains.entries()]);

  return chainEntries.map(([chainId, chain]) => {
    const endBlock = chain.config.endBlock ? blockViewModel(chain.config.endBlock) : null;

    return (
      <Card key={`Chain#${chainId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-row justify-start items-center gap-2">
                <ChainName chainId={chainId} className="font-semibold text-left" />
                <ChainIcon chainId={chainId} />
              </div>
            </div>

            <Badge
              className={cn("uppercase text-xs leading-none")}
              title={`Chain indexing status: ${chain.status}`}
            >
              {chain.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <BlockStats
              chainId={chainId}
              label="Indexing start block"
              block={blockViewModel(chain.config.startBlock)}
            />

            <BlockStats chainId={chainId} label="Indexing end block" block={endBlock} />
          </div>
        </CardContent>
      </Card>
    );
  });
}

/**
 * Indexing stats for {@link OverallIndexingStatusIds.Backfill}.
 */
export function IndexingStatsForBackfillStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingBackfillStatus>) {
  const chainEntries = sortAscChainStatusesByStartBlock([...indexingStatus.chains.entries()]);

  return chainEntries.map(([chainId, chain]) => {
    const endBlock = chain.config.endBlock ? blockViewModel(chain.config.endBlock) : null;

    return (
      <Card key={`Chain#${chainId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-row justify-start items-center gap-2">
                <ChainName chainId={chainId} className="font-semibold text-left" />
                <ChainIcon chainId={chainId} />
              </div>
            </div>

            <Badge
              className="uppercase text-xs leading-none"
              title={`Chain indexing status: ${chain.status}`}
            >
              {chain.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <BlockStats
              chainId={chainId}
              label="Indexing start block"
              block={blockViewModel(chain.config.startBlock)}
            />

            <BlockStats chainId={chainId} label="Indexing end block" block={endBlock} />

            {chain.status === ChainIndexingStatusIds.Backfill && (
              <>
                <BlockStats
                  chainId={chainId}
                  label="Latest indexed block"
                  block={blockViewModel(chain.latestIndexedBlock)}
                />

                <BlockStats
                  chainId={chainId}
                  label="Backfill end block"
                  block={blockViewModel(chain.backfillEndBlock)}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });
}

/**
 * Indexing stats for {@link OverallIndexingStatusIds.Completed}.
 */
export function IndexingStatsForCompletedStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingCompletedStatus>) {
  const chainEntries = sortAscChainStatusesByStartBlock([...indexingStatus.chains.entries()]);

  return chainEntries.map(([chainId, chain]) => {
    const endBlock = chain.config.endBlock ? blockViewModel(chain.config.endBlock) : null;

    return (
      <Card key={`Chain#${chainId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-row justify-start items-center gap-2">
                <ChainName chainId={chainId} className="font-semibold text-left" />
                <ChainIcon chainId={chainId} />
              </div>
            </div>

            <Badge
              className="uppercase text-xs leading-none"
              title={`Chain indexing status: ${chain.status}`}
            >
              {chain.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <BlockStats
              chainId={chainId}
              label="Indexing start block"
              block={blockViewModel(chain.config.startBlock)}
            />

            <BlockStats chainId={chainId} label="Indexing end block" block={endBlock} />

            <BlockStats
              chainId={chainId}
              label="Latest indexed block"
              block={blockViewModel(chain.latestIndexedBlock)}
            />
          </div>
        </CardContent>
      </Card>
    );
  });
}

/**
 * Indexing stats for {@link OverallIndexingStatusIds.Following}.
 */
export function IndexingStatsForFollowingStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingFollowingStatus>) {
  const chainEntries = sortAscChainStatusesByStartBlock([...indexingStatus.chains.entries()]);

  return chainEntries.map(([chainId, chain]) => {
    const endBlock = chain.config.endBlock ? blockViewModel(chain.config.endBlock) : null;

    return (
      <Card key={`Chain#${chainId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-row justify-start items-center gap-2">
                <ChainName chainId={chainId} className="font-semibold text-left" />
                <ChainIcon chainId={chainId} />
              </div>
            </div>

            <Badge
              className="uppercase text-xs leading-none"
              title={`Chain indexing status: ${chain.status}`}
            >
              {chain.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <BlockStats
              chainId={chainId}
              label="Indexing start block"
              block={blockViewModel(chain.config.startBlock)}
            />

            <BlockStats chainId={chainId} label="Indexing end block" block={endBlock} />

            {chain.status === ChainIndexingStatusIds.Backfill && (
              <>
                <BlockStats
                  chainId={chainId}
                  label="Latest indexed block"
                  block={blockViewModel(chain.latestIndexedBlock)}
                />

                <BlockStats
                  chainId={chainId}
                  label="Backfill end block"
                  block={blockViewModel(chain.backfillEndBlock)}
                />
              </>
            )}

            {chain.status === ChainIndexingStatusIds.Following && (
              <>
                <BlockStats
                  chainId={chainId}
                  label="Latest indexed block"
                  block={blockViewModel(chain.latestIndexedBlock)}
                />

                <BlockStats
                  chainId={chainId}
                  label="Latest known block"
                  block={blockViewModel(chain.latestKnownBlock)}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });
}

/**
 * Indexing Stats Shell
 *
 * UI component for presenting indexing stats UI for specific overall status.
 */
export function IndexingStatsShell({
  overallStatus,
  children,
}: PropsWithChildren<{ overallStatus: OverallIndexingStatusId }>) {
  return (
    <Card className="w-full flex flex-col gap-2">
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <span>Indexing Status</span>

          <Badge
            className={cn(
              "uppercase text-xs leading-none",
              overallStatus === OverallIndexingStatusIds.IndexerError && "bg-red-600 text-white",
            )}
            title={`Overall indexing status: ${overallStatus}`}
          >
            {overallStatus === OverallIndexingStatusIds.IndexerError
              ? "Indexer Error"
              : overallStatus}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        <section className="grid gap-8 grid-cols-1 sm:grid-cols-2">{children}</section>
      </CardContent>
    </Card>
  );
}
