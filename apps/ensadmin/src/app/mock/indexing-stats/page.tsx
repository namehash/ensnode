"use client";

import { useNow } from "@namehash/namehash-ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  CrossChainIndexingStatusSnapshot,
  createRealtimeIndexingStatusProjection,
  IndexingStatusResponseCodes,
  IndexingStatusResponseOk,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";

import { IndexingStats } from "@/components/indexing-status/indexing-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { indexingStatusResponseOkOmnichain } from "../indexing-status-api.mock";

type LoadingVariant = "Loading" | "Loading Error";
type ResponseOkVariant = keyof typeof indexingStatusResponseOkOmnichain;
type ResponseErrorVariant = "Error ResponseCode";
type Variant = ResponseOkVariant | ResponseErrorVariant | LoadingVariant;

const variants = [
  OmnichainIndexingStatusIds.Unstarted,
  OmnichainIndexingStatusIds.Backfill,
  OmnichainIndexingStatusIds.Following,
  OmnichainIndexingStatusIds.Completed,
  "Loading",
  "Loading Error",
  "Error ResponseCode",
] as const;

let loadingTimeoutId: number;

async function fetchMockedIndexingStatus(
  selectedVariant: Variant,
): Promise<CrossChainIndexingStatusSnapshot> {
  // always try clearing loading timeout when performing a mocked fetch
  // this way we get a fresh and very long request to observe the loading state
  if (loadingTimeoutId) {
    clearTimeout(loadingTimeoutId);
  }

  switch (selectedVariant) {
    case OmnichainIndexingStatusIds.Unstarted:
    case OmnichainIndexingStatusIds.Backfill:
    case OmnichainIndexingStatusIds.Following:
    case OmnichainIndexingStatusIds.Completed: {
      const response = indexingStatusResponseOkOmnichain[
        selectedVariant
      ] as IndexingStatusResponseOk;

      return response.realtimeProjection.snapshot;
    }
    case "Error ResponseCode":
      throw new Error(
        "Received Indexing Status response with responseCode other than 'ok' which will not be cached.",
      );
    case "Loading":
      return new Promise<CrossChainIndexingStatusSnapshot>((_resolve, reject) => {
        loadingTimeoutId = +setTimeout(reject, 5 * 60 * 1_000);
      });
    case "Loading Error":
      throw new Error("Fetch failed");
  }
}

export default function MockIndexingStatusPage() {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    OmnichainIndexingStatusIds.Unstarted,
  );
  const now = useNow();

  const mockedIndexingStatus = useQuery({
    queryKey: ["mock", "useIndexingStatus", selectedVariant],
    queryFn: () => fetchMockedIndexingStatus(selectedVariant),
    select: (cachedSnapshot) => {
      return {
        responseCode: IndexingStatusResponseCodes.Ok,
        realtimeProjection: createRealtimeIndexingStatusProjection(cachedSnapshot, now),
      } satisfies IndexingStatusResponseOk;
    },
    retry: false, // allows loading error to be observed immediately
  });

  useEffect(() => {
    mockedIndexingStatus.refetch();
  }, [mockedIndexingStatus.refetch]);

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Mock: IndexingStats</CardTitle>
          <CardDescription>Select a mock IndexingStats variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Button
                key={variant}
                variant={selectedVariant === variant ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVariant(variant)}
              >
                {variant}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <IndexingStats {...mockedIndexingStatus} />
    </section>
  );
}
