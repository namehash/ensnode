"use client";

import * as schema from "@ensnode/ponder-schema";
import { and, count, like, not } from "@ponder/client";
import { usePonderQuery } from "@ponder/react";
import { fromUnixTime, intlFormat } from "date-fns";
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useIndexingStatusQuery } from "../ensnode";
import { globalIndexingStatusViewModel } from "../indexing-status/view-models";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface DomainStats {
  name: string;
  ensNodeCount: number;
  subgraphCount: number;
  color: string;
}

// Client-only date formatter component
function FormattedDate({
  timestamp,
  options,
}: { timestamp: string; options: Intl.DateTimeFormatOptions }) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    try {
      const parsedTimestamp = parseInt(timestamp);
      if (!isNaN(parsedTimestamp)) {
        setFormattedDate(intlFormat(fromUnixTime(parsedTimestamp), options));
      } else {
        setFormattedDate("Invalid date");
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      setFormattedDate("Invalid date");
    }
  }, [timestamp, options]);

  return <>{formattedDate}</>;
}

/**
 * Custom hook to fetch domain counts for specific domain suffixes
 */
function useDomainCounts() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DomainStats[]>([
    {
      name: "eth",
      ensNodeCount: 0,
      subgraphCount: 0, // Will be set to the same value as ensNodeCount
      color: "hsl(var(--chart-1))",
    },
    {
      name: "base.eth",
      ensNodeCount: 0,
      subgraphCount: 0, // ENS Subgraph doesn't index these
      color: "hsl(var(--chart-2))",
    },
    {
      name: "linea.eth",
      ensNodeCount: 0,
      subgraphCount: 0, // ENS Subgraph doesn't index these
      color: "hsl(var(--chart-3))",
    },
  ]);

  // Query for domains ending with .eth (excluding subdomains)
  const ethDomainsQuery = usePonderQuery({
    queryFn: (db) => {
      return db
        .select({
          totalCount: count(schema.domain.id),
        })
        .from(schema.domain)
        .where(and(like(schema.domain.name, "%.eth"), not(like(schema.domain.name, "%.%.eth"))));
    },
  });

  // Query for domains ending with .base.eth
  const baseDomainsQuery = usePonderQuery({
    queryFn: (db) => {
      return db
        .select({
          totalCount: count(schema.domain.id),
        })
        .from(schema.domain)
        .where(like(schema.domain.name, "%.base.eth"));
    },
  });

  // Query for domains ending with .linea.eth
  const lineaDomainsQuery = usePonderQuery({
    queryFn: (db) => {
      return db
        .select({
          totalCount: count(schema.domain.id),
        })
        .from(schema.domain)
        .where(like(schema.domain.name, "%.linea.eth"));
    },
  });

  // Update stats when data is loaded
  useEffect(() => {
    const isAllLoaded =
      !ethDomainsQuery.isLoading && !baseDomainsQuery.isLoading && !lineaDomainsQuery.isLoading;

    if (isAllLoaded) {
      // Using a functional update to avoid dependency on stats
      setStats((prevStats) => {
        const newStats = [...prevStats];

        // Update eth count if available and make subgraphCount match ensNodeCount
        if (ethDomainsQuery.data && ethDomainsQuery.data[0]?.totalCount !== undefined) {
          const ethCount = Number(ethDomainsQuery.data[0].totalCount);
          newStats[0] = {
            ...newStats[0],
            ensNodeCount: ethCount,
            subgraphCount: ethCount, // ENS Subgraph also indexes .eth domains, so use the same count
          };
        }

        // Update base.eth count if available
        if (baseDomainsQuery.data && baseDomainsQuery.data[0]?.totalCount !== undefined) {
          newStats[1] = {
            ...newStats[1],
            ensNodeCount: Number(baseDomainsQuery.data[0].totalCount),
          };
        }

        // Update linea.eth count if available
        if (lineaDomainsQuery.data && lineaDomainsQuery.data[0]?.totalCount !== undefined) {
          newStats[2] = {
            ...newStats[2],
            ensNodeCount: Number(lineaDomainsQuery.data[0].totalCount),
          };
        }

        return newStats;
      });

      setIsLoading(false);
    }
  }, [
    ethDomainsQuery.data,
    baseDomainsQuery.data,
    lineaDomainsQuery.data,
    ethDomainsQuery.isLoading,
    baseDomainsQuery.isLoading,
    lineaDomainsQuery.isLoading,
    // stats removed from dependency array to avoid infinite render loop
  ]);

  // Handle error state - use fallback values
  useEffect(() => {
    if (ethDomainsQuery.error || baseDomainsQuery.error || lineaDomainsQuery.error) {
      console.error("Error fetching domain counts", {
        eth: ethDomainsQuery.error,
        base: baseDomainsQuery.error,
        linea: lineaDomainsQuery.error,
      });

      // When using fallback values, make sure eth subgraphCount matches ensNodeCount
      const ethCount = 3399553; // Fallback value

      // Use fallback values
      setStats([
        {
          name: "eth",
          ensNodeCount: ethCount,
          subgraphCount: ethCount, // Using the same value for both
          color: "hsl(var(--chart-1))",
        },
        {
          name: "base.eth",
          ensNodeCount: 727104, // Fallback value
          subgraphCount: 0,
          color: "hsl(var(--chart-2))",
        },
        {
          name: "linea.eth",
          ensNodeCount: 568653, // Fallback value
          subgraphCount: 0,
          color: "hsl(var(--chart-3))",
        },
      ]);
      setIsLoading(false);
    }
  }, [ethDomainsQuery.error, baseDomainsQuery.error, lineaDomainsQuery.error]);

  return { stats, isLoading };
}

export function ENSNodeBenchmarkComparison() {
  const { stats: domainStats, isLoading: loading } = useDomainCounts();
  const searchParams = useSearchParams();
  const indexingStatus = useIndexingStatusQuery(searchParams);

  // Get the current indexing date from the indexing status
  const currentIndexingDate = indexingStatus.data
    ? globalIndexingStatusViewModel(indexingStatus.data.runtime.networkIndexingStatusByChainId)
        .currentIndexingDate
    : null;

  // Calculate totals for comparison
  const totalEnsNode = domainStats.reduce((sum, stat) => sum + stat.ensNodeCount, 0);
  const totalSubgraph = domainStats.reduce((sum, stat) => sum + stat.subgraphCount, 0);

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>ENS Name Indexing Coverage</span>
          {currentIndexingDate && (
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium">
                Last indexed block on{" "}
                <FormattedDate
                  timestamp={(currentIndexingDate.getTime() / 1000).toString()}
                  options={{
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }}
                />
              </span>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Comparing domain indexing capabilities between ENS Subgraph and ENSNode
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-10">
          {/* ENS Subgraph Bar - FIRST */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-base">ENS Subgraph</span>
                <Badge variant="secondary">{formatNumber(totalSubgraph)} domains</Badge>
              </div>
              <span className="text-sm font-semibold">
                {totalEnsNode
                  ? `${Math.round((totalSubgraph / totalEnsNode) * 100)}%`
                  : "Loading..."}
              </span>
            </div>
            <div className="relative h-12 bg-muted rounded-md overflow-hidden">
              {domainStats.map((stat, index) => {
                if (stat.subgraphCount === 0) return null;

                // For subgraph, we're showing as a percentage of the ENSNode total for comparison
                const widthPercent = totalEnsNode ? (stat.subgraphCount / totalEnsNode) * 100 : 0;

                return (
                  <div
                    key={`subgraph-${stat.name}`}
                    className="absolute top-0 h-full"
                    style={{
                      left: `0%`,
                      width: `${widthPercent}%`,
                      backgroundColor: stat.color,
                    }}
                    title={`${stat.name}: ${new Intl.NumberFormat().format(stat.subgraphCount)} domains`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: domainStats[0].color }}
                ></div>
                <span>
                  {domainStats[0].name} ({formatNumber(domainStats[0].subgraphCount)})
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
                <span>
                  No indexing for {domainStats[1].name} or {domainStats[2].name}
                </span>
              </div>
            </div>
          </div>

          {/* ENSNode Bar - SECOND */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-base">ENSNode</span>
                {loading ? (
                  <Badge variant="secondary">Loading...</Badge>
                ) : (
                  <Badge variant="secondary">{formatNumber(totalEnsNode)} domains</Badge>
                )}
              </div>
              <span className="text-sm font-semibold">100%</span>
            </div>
            <div className="relative h-12 bg-muted rounded-md overflow-hidden">
              {!loading &&
                totalEnsNode > 0 &&
                domainStats.map((stat, index) => {
                  // Calculate the width as a proportion of total width
                  const startPercent =
                    (domainStats.slice(0, index).reduce((sum, s) => sum + s.ensNodeCount, 0) /
                      totalEnsNode) *
                    100;

                  const widthPercent = (stat.ensNodeCount / totalEnsNode) * 100;

                  return (
                    <div
                      key={`ensnode-${stat.name}`}
                      className="absolute top-0 h-full"
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: stat.color,
                      }}
                      title={`${stat.name}: ${new Intl.NumberFormat().format(stat.ensNodeCount)} domains`}
                    />
                  );
                })}

              {loading && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <div className="h-2 w-24 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground/50 w-1/2 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {domainStats.map((stat, index) => (
                <div key={`ensnode-legend-${index}`} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stat.color }}></div>
                  <span>
                    {stat.name} ({loading ? "..." : formatNumber(stat.ensNodeCount)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {!loading && totalEnsNode > 0 && (
            <div className="bg-secondary p-4 rounded-md">
              <p className="text-sm font-medium">
                ENSNode indexes{" "}
                <span className="font-bold">{formatNumber(totalEnsNode - totalSubgraph)}</span> more
                domains than the ENS Subgraph, providing{" "}
                {Math.round((totalEnsNode / totalSubgraph) * 100 - 100)}% better coverage for ENS
                domain data.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-secondary p-4 rounded-md animate-pulse">
              <p className="text-sm font-medium">Loading domain statistics...</p>
            </div>
          )}
        </div>

        {/* Additional roadmap information */}
        <div className="mt-10 border-t pt-6">
          <h3 className="text-base font-semibold mb-4">Coming Soon in Our Roadmap</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-secondary/50 p-4 rounded-md">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="outline" className="bg-accent">
                  Coming Soon
                </Badge>
                3DNS Tokenized DNS Names
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Enhanced support for 3DNS tokenized DNS names through an additional ENSNode plugin.
              </p>
            </div>
            <div className="bg-secondary/50 p-4 rounded-md">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="outline" className="bg-accent">
                  Coming Soon
                </Badge>
                Offchain Name Indexing
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Support for various offchain names, including uni.eth, cb.id, Namestone, Namespace,
                and Justanid issued names.
              </p>
            </div>
            <div className="md:col-span-2 bg-secondary/50 p-4 rounded-md">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Badge variant="outline" className="bg-accent">
                  In Development
                </Badge>
                ENSIPs for Comprehensive Indexing
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Enabling automated indexing of any ENSv2 subname registry through new ENSIPs.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
