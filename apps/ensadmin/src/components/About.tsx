import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getBlockExplorerUrl, getChainName, isSupportedChain } from "../utils/chains";
import { cn } from "../utils/ui";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface AppContext {
  ensnodeUrl: string;
}

interface BlockInfo {
  number: number;
  timestamp: number;
}

interface ChainStatus {
  block: BlockInfo;
  ready: boolean;
}

type StatusResponse = Record<string, ChainStatus>;

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toUTCString();
}

function isValidChainStatus(status: unknown): status is ChainStatus {
  if (!status || typeof status !== "object") return false;
  const s = status as {
    block: {
      number: number;
      timestamp: number;
    };
    ready: boolean;
  };
  return (
    typeof s.ready === "boolean" &&
    s.block &&
    typeof s.block.number === "number" &&
    typeof s.block.timestamp === "number"
  );
}

export function About() {
  const { ensnodeUrl } = useOutletContext<AppContext>();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${ensnodeUrl}/status`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        const data = await response.json();

        // Validate the response data
        const validatedStatus: StatusResponse = {};
        let hasValidData = false;

        for (const [chainId, chainStatus] of Object.entries(data)) {
          if (isValidChainStatus(chainStatus)) {
            validatedStatus[chainId] = chainStatus;
            hasValidData = true;
          }
        }

        if (!hasValidData) {
          throw new Error("Invalid status data received");
        }

        setStatus(validatedStatus);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch status");
        setStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (ensnodeUrl) {
      fetchStatus();
    }
  }, [ensnodeUrl]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <Info className="h-5 w-5" />
              <p>Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!status || Object.keys(status).length === 0) {
    return (
      <div className="p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-700">
              <Info className="h-5 w-5" />
              <p>No status data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Chain Status</h2>
      <div className="grid gap-4">
        {Object.entries(status).map(([chainId, chainStatus]) => {
          const chainIdNum = parseInt(chainId);

          if (!isSupportedChain(chainIdNum)) {
            return null;
          }

          const blockExplorerUrl = getBlockExplorerUrl(chainIdNum, chainStatus.block.number);
          const timestamp = new Date(chainStatus.block.timestamp * 1000);

          return (
            <Card key={chainId}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle>{getChainName(chainIdNum)}</CardTitle>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 text-xs font-medium rounded-full",
                      chainStatus.ready
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800",
                    )}
                  >
                    {chainStatus.ready ? "Ready" : "Syncing"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="space-y-1">
                  <p className="font-medium text-card-foreground">Last Indexed Block</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Number:</span>
                    <span>{chainStatus.block.number.toLocaleString()}</span>
                    {blockExplorerUrl && (
                      <a
                        href={blockExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View block</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Timestamp:</span>
                  <time dateTime={formatDate(chainStatus.block.timestamp)}>
                    {formatDistanceToNow(timestamp, { addSuffix: true })}
                  </time>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
