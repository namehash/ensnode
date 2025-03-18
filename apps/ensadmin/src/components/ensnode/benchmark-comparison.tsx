"use client";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface DomainStats {
  name: string;
  ensNodeCount: number;
  subgraphCount: number;
  color: string;
}

export function ENSNodeBenchmarkComparison() {
  // Actual data with corrected counts
  const domainStats: DomainStats[] = [
    {
      name: "eth",
      ensNodeCount: 3399553, // Actual eth count
      subgraphCount: 3399553, // Both index .eth domains
      color: "hsl(var(--chart-1))",
    },
    {
      name: "base.eth",
      ensNodeCount: 727104, // Actual base.eth count
      subgraphCount: 0, // Subgraph doesn't index these
      color: "hsl(var(--chart-2))",
    },
    {
      name: "linea.eth",
      ensNodeCount: 568653, // Actual linea.eth count
      subgraphCount: 0, // Subgraph doesn't index these
      color: "hsl(var(--chart-3))",
    },
  ];

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

  // Calculate maximum value for scaling
  const maxValue = Math.max(totalEnsNode, totalSubgraph);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>ENS Name Indexing Coverage</CardTitle>
        <CardDescription>
          Comparing domain indexing capabilities between ENS Subgraph and ENSNode
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-10">
          {/* ENS Subgraph Bar - Now FIRST */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-base">ENS Subgraph</span>
                <Badge variant="secondary">{formatNumber(totalSubgraph)} domains</Badge>
              </div>
              <span className="text-sm font-semibold">
                {Math.round((totalSubgraph / totalEnsNode) * 100)}%
              </span>
            </div>
            <div className="relative h-12 bg-muted rounded-md overflow-hidden">
              {domainStats.map((stat, index) => {
                if (stat.subgraphCount === 0) return null;

                // For subgraph, we're showing as a percentage of the ENSNode total for comparison
                const widthPercent = (stat.subgraphCount / totalEnsNode) * 100;

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

          {/* ENSNode Bar - Now SECOND */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-base">ENSNode</span>
                <Badge variant="secondary">{formatNumber(totalEnsNode)} domains</Badge>
              </div>
              <span className="text-sm font-semibold">100%</span>
            </div>
            <div className="relative h-12 bg-muted rounded-md overflow-hidden">
              {domainStats.map((stat, index) => {
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
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {domainStats.map((stat, index) => (
                <div key={`ensnode-legend-${index}`} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stat.color }}></div>
                  <span>
                    {stat.name} ({formatNumber(stat.ensNodeCount)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-secondary p-4 rounded-md">
            <p className="text-sm font-medium">
              ENSNode indexes{" "}
              <span className="font-bold">{formatNumber(totalEnsNode - totalSubgraph)}</span> more
              domains than the ENS Subgraph, providing{" "}
              {Math.round((totalEnsNode / totalSubgraph) * 100 - 100)}% better coverage for ENS
              domain data.
            </p>
          </div>
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
