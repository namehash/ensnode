/**
 * This file describes UI components for each of {@link OmnichainIndexingStatusId}.
 *
 * Each omnichain status can present different indexing stats.
 */

import { ChainIcon } from "@namehash/namehash-ui";
import type { PropsWithChildren, ReactElement } from "react";

import type { useIndexingStatus } from "@ensnode/ensnode-react";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type CrossChainIndexingStatusSnapshotOmnichain,
  IndexingStatusResponseCodes,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  type OmnichainIndexingStatusSnapshotBackfill,
  type OmnichainIndexingStatusSnapshotCompleted,
  type OmnichainIndexingStatusSnapshotFollowing,
  type OmnichainIndexingStatusSnapshotUnstarted,
  type RealtimeIndexingStatusProjection,
  sortChainStatusesByStartBlockAsc,
} from "@ensnode/ensnode-sdk";

import { ChainName } from "@/components/chains/ChainName";
import { useIndexingStatusWithSwr } from "@/components/indexing-status/use-indexing-status-with-swr";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChainStatus, formatOmnichainIndexingStatus } from "@/lib/indexing-status";
import { cn } from "@/lib/utils";

import { BackfillStatus } from "./backfill-status";
import { BlockStats } from "./block-refs";
import { IndexingStatusLoading } from "./indexing-status-loading";

interface IndexingStatsForOmnichainStatusSnapshotProps<
  OmnichainIndexingStatusSnapshotType extends
    OmnichainIndexingStatusSnapshot = OmnichainIndexingStatusSnapshot,
> {
  realtimeProjection: Omit<RealtimeIndexingStatusProjection, "snapshot"> & {
    snapshot: Omit<CrossChainIndexingStatusSnapshotOmnichain, "omnichainSnapshot"> & {
      omnichainSnapshot: OmnichainIndexingStatusSnapshotType;
    };
  };
}

/**
 * Indexing stats when indexing status snapshot was not available.
 */
export function IndexingStatsForUnavailableSnapshot() {
  return (
    <p>
      It appears that the indexing of new blocks has been interrupted. API requests to this ENSNode
      should continue working successfully but may serve data that isn't updated to the latest
      onchain state.
    </p>
  );
}

/**
 * Indexing stats for {@link OmnichainIndexingStatusIds.Unstarted}.
 */
export function IndexingStatsForSnapshotUnstarted({
  realtimeProjection,
}: IndexingStatsForOmnichainStatusSnapshotProps<OmnichainIndexingStatusSnapshotUnstarted>) {
  const { omnichainSnapshot } = realtimeProjection.snapshot;
  const chainEntries = sortChainStatusesByStartBlockAsc([...omnichainSnapshot.chains.entries()]);

  return chainEntries.map(([chainId, chain]) => {
    const endBlock =
      chain.config.configType === ChainIndexingConfigTypeIds.Definite
        ? chain.config.endBlock
        : null;

    return (
      <Card key={`Chain#${chainId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-row justify-start items-center gap-2">
                <ChainIcon chainId={chainId} />
                <ChainName chainId={chainId} className="font-semibold text-left" />
              </div>
            </div>

            <Badge
              className={cn("uppercase text-xs leading-none")}
              title={`Chain indexing status: ${formatChainStatus(chain.chainStatus)}`}
            >
              {formatChainStatus(chain.chainStatus)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <BlockStats
              chainId={chainId}
              label="Indexing start block"
              block={chain.config.startBlock}
            />

            <BlockStats chainId={chainId} label="Indexing end block" block={endBlock} />
          </div>
        </CardContent>
      </Card>
    );
  });
}

/**
 * Indexing stats for {@link OmnichainIndexingStatusIds.Backfill}.
 */
export function IndexingStatsForSnapshotBackfill({
  realtimeProjection,
}: IndexingStatsForOmnichainStatusSnapshotProps<OmnichainIndexingStatusSnapshotBackfill>) {
  const { omnichainSnapshot } = realtimeProjection.snapshot;
  const chainEntries = sortChainStatusesByStartBlockAsc([...omnichainSnapshot.chains.entries()]);

  return chainEntries.map(([chainId, chain]) => {
    const endBlock =
      chain.config.configType === ChainIndexingConfigTypeIds.Definite
        ? chain.config.endBlock
        : null;

    return (
      <Card key={`Chain#${chainId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-row justify-start items-center gap-2">
                <ChainIcon chainId={chainId} />
                <ChainName chainId={chainId} className="font-semibold text-left" />
              </div>
            </div>

            <Badge
              className="uppercase text-xs leading-none"
              title={`Chain indexing status: ${formatChainStatus(chain.chainStatus)}`}
            >
              {formatChainStatus(chain.chainStatus)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <BlockStats
              chainId={chainId}
              label="Indexing start block"
              block={chain.config.startBlock}
            />

            <BlockStats chainId={chainId} label="Indexing end block" block={endBlock} />

            {chain.chainStatus === ChainIndexingStatusIds.Backfill && (
              <>
                <BlockStats
                  chainId={chainId}
                  label="Latest indexed block"
                  block={chain.latestIndexedBlock}
                />

                <BlockStats
                  chainId={chainId}
                  label="Backfill end block"
                  block={chain.backfillEndBlock}
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
 * Indexing stats for {@link OmnichainIndexingStatusIds.Completed}.
 */
export function IndexingStatsForSnapshotCompleted({
  realtimeProjection,
}: IndexingStatsForOmnichainStatusSnapshotProps<OmnichainIndexingStatusSnapshotCompleted>) {
  const { omnichainSnapshot } = realtimeProjection.snapshot;
  const chainEntries = sortChainStatusesByStartBlockAsc([...omnichainSnapshot.chains.entries()]);

  return chainEntries.map(([chainId, chain]) => {
    const endBlock =
      chain.config.configType === ChainIndexingConfigTypeIds.Definite
        ? chain.config.endBlock
        : null;

    return (
      <Card key={`Chain#${chainId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-row justify-start items-center gap-2">
                <ChainIcon chainId={chainId} />
                <ChainName chainId={chainId} className="font-semibold text-left" />
              </div>
            </div>

            <Badge
              className="uppercase text-xs leading-none"
              title={`Chain indexing status: ${formatChainStatus(chain.chainStatus)}`}
            >
              {formatChainStatus(chain.chainStatus)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <BlockStats
              chainId={chainId}
              label="Indexing start block"
              block={chain.config.startBlock}
            />

            <BlockStats chainId={chainId} label="Indexing end block" block={endBlock} />

            <BlockStats
              chainId={chainId}
              label="Latest indexed block"
              block={chain.latestIndexedBlock}
            />
          </div>
        </CardContent>
      </Card>
    );
  });
}

/**
 * Indexing stats for {@link OmnichainIndexingStatusIds.Following}.
 */
export function IndexingStatsForSnapshotFollowing({
  realtimeProjection,
}: IndexingStatsForOmnichainStatusSnapshotProps<OmnichainIndexingStatusSnapshotFollowing>) {
  const { omnichainSnapshot } = realtimeProjection.snapshot;
  const chainEntries = sortChainStatusesByStartBlockAsc([...omnichainSnapshot.chains.entries()]);

  return chainEntries.map(([chainId, chain]) => {
    const endBlock =
      chain.config.configType === ChainIndexingConfigTypeIds.Definite
        ? chain.config.endBlock
        : null;

    return (
      <Card key={`Chain#${chainId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex flex-row justify-start items-center gap-2">
                <ChainIcon chainId={chainId} />
                <ChainName chainId={chainId} className="font-semibold text-left" />
              </div>
            </div>

            <Badge
              className="uppercase text-xs leading-none"
              title={`Chain indexing status: ${formatChainStatus(chain.chainStatus)}`}
            >
              {formatChainStatus(chain.chainStatus)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <BlockStats
              chainId={chainId}
              label="Indexing start block"
              block={chain.config.startBlock}
            />

            <BlockStats chainId={chainId} label="Indexing end block" block={endBlock} />

            {chain.chainStatus === ChainIndexingStatusIds.Backfill && (
              <>
                <BlockStats
                  chainId={chainId}
                  label="Latest indexed block"
                  block={chain.latestIndexedBlock}
                />

                <BlockStats
                  chainId={chainId}
                  label="Backfill end block"
                  block={chain.backfillEndBlock}
                />
              </>
            )}

            {chain.chainStatus === ChainIndexingStatusIds.Following && (
              <>
                <BlockStats
                  chainId={chainId}
                  label="Latest indexed block"
                  block={chain.latestIndexedBlock}
                />

                <BlockStats
                  chainId={chainId}
                  label="Latest known block"
                  block={chain.latestKnownBlock}
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
  omnichainStatus,
  children,
}: PropsWithChildren<{ omnichainStatus?: OmnichainIndexingStatusId }>) {
  return (
    <Card className="w-full flex flex-col gap-2">
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <span>Indexing Status</span>

          {omnichainStatus && (
            <Badge
              className={cn("uppercase text-xs leading-none")}
              title={`Omnichain indexing status: ${formatOmnichainIndexingStatus(omnichainStatus)}`}
            >
              {formatOmnichainIndexingStatus(omnichainStatus)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        <section className="grid gap-8 grid-cols-1 sm:grid-cols-2">{children}</section>
      </CardContent>
    </Card>
  );
}

function buildIndexingStatsProps<
  const OmnichainIndexingStatusSnapshotType extends OmnichainIndexingStatusSnapshot,
>(
  realtimeProjection: RealtimeIndexingStatusProjection,
  omnichainStatusSnapshot: OmnichainIndexingStatusSnapshotType,
): IndexingStatsForOmnichainStatusSnapshotProps<OmnichainIndexingStatusSnapshotType> {
  return {
    realtimeProjection: {
      ...realtimeProjection,
      snapshot: {
        ...realtimeProjection.snapshot,
        omnichainSnapshot: omnichainStatusSnapshot,
      },
    },
  };
}

interface IndexingStatsForRealtimeStatusProjectionProps {
  realtimeProjection: RealtimeIndexingStatusProjection;
}

/**
 * Display indexing stats for a {@link RealtimeIndexingStatusProjection}.
 */
export function IndexingStatsForRealtimeStatusProjection({
  realtimeProjection,
}: IndexingStatsForRealtimeStatusProjectionProps) {
  const omnichainStatusSnapshot = realtimeProjection.snapshot.omnichainSnapshot;
  let indexingStats: ReactElement;
  let maybeIndexingTimeline: ReactElement | undefined;

  switch (omnichainStatusSnapshot.omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted:
      indexingStats = (
        <IndexingStatsForSnapshotUnstarted
          {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
        />
      );
      break;

    case OmnichainIndexingStatusIds.Backfill:
      indexingStats = (
        <IndexingStatsForSnapshotBackfill
          {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
        />
      );

      maybeIndexingTimeline = (
        <BackfillStatus {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)} />
      );
      break;

    case OmnichainIndexingStatusIds.Completed:
      indexingStats = (
        <IndexingStatsForSnapshotCompleted
          {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
        />
      );
      break;

    case OmnichainIndexingStatusIds.Following:
      indexingStats = (
        <IndexingStatsForSnapshotFollowing
          {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
        />
      );
      break;
  }

  return (
    <section className="flex flex-col gap-6">
      {maybeIndexingTimeline}

      <IndexingStatsShell omnichainStatus={omnichainStatusSnapshot.omnichainStatus}>
        {indexingStats}
      </IndexingStatsShell>
    </section>
  );
}

type IndexingStatsProps = ReturnType<typeof useIndexingStatusWithSwr>;

/**
 * Display indexing stats based on query results from {@link useIndexingStatusWithSwr}.
 */
export function IndexingStats(props: IndexingStatsProps) {
  const indexingStatusQuery = props;

  if (indexingStatusQuery.isError) {
    return (
      <IndexingStatsShell>
        <IndexingStatsForUnavailableSnapshot />
      </IndexingStatsShell>
    );
  }

  if (indexingStatusQuery.isPending) {
    return <IndexingStatusLoading />;
  }

  const indexingStatus = indexingStatusQuery.data;

  return (
    <IndexingStatsForRealtimeStatusProjection
      realtimeProjection={indexingStatus.realtimeProjection}
    />
  );
}
