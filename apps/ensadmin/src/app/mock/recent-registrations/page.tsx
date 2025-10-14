"use client";
import {
  RecentRegistrations,
  type RecentRegistrationsErrorProps,
  type RecentRegistrationsOkProps,
} from "@/components/recent-registrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IndexingStatusResponseCodes,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { useMemo, useState } from "react";

import { ensIndexerPublicConfig } from "../config-api.mock";
import { indexingStatusResponseOkOmnichain } from "../indexing-status-api.mock";

type LoadingVariant = "Loading" | "Loading Error";
type ResponseVariant = "Response Error";
type RegistrationsVariant = OmnichainIndexingStatusId | LoadingVariant | ResponseVariant;

const DEFAULT_VARIANT = OmnichainIndexingStatusIds.Following;

export default function MockRegistrationsPage() {
  // TODO: Add a serialization error variant,
  //  once a custom API for querying registration data is implemented.
  const [selectedVariant, setSelectedVariant] = useState<RegistrationsVariant>(DEFAULT_VARIANT);

  const props = useMemo(() => {
    switch (selectedVariant) {
      case "Loading":
        return {};

      case "Loading Error":
        return {
          error: {
            title: "RecentRegistrations Error",
            description: "Failed to fetch ENSIndexerConfig or IndexingStatus.",
          },
        } satisfies RecentRegistrationsErrorProps;

      case "Response Error":
        return {
          error: {
            title: "IndexingStatus error",
            description: "Indexing Status is currently unavailable.",
          },
        } satisfies RecentRegistrationsErrorProps;

      default:
        try {
          const indexingStatus = indexingStatusResponseOkOmnichain[selectedVariant];

          // Invariant: mocked response is an OK response
          if (indexingStatus.responseCode !== IndexingStatusResponseCodes.Ok) {
            throw new Error("Indexing Status API Response should have the `ok` response code.");
          }

          return {
            ensIndexerConfig: ensIndexerPublicConfig,
            realtimeProjection: indexingStatus.realtimeProjection,
          } satisfies RecentRegistrationsOkProps;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown RecentRegistrations mock data deserialization error";
          return {
            error: { title: "Deserialization Error", description: errorMessage },
          } satisfies RecentRegistrationsErrorProps;
        }
    }
  }, [selectedVariant]);

  const variants = [
    ...Object.keys(indexingStatusResponseOkOmnichain),
    "Loading",
    "Loading Error",
    "Response Error",
  ];

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle>Mock: RecentRegistrations</CardTitle>
          <CardDescription>Select a mock RecentRegistrations variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <Button
                key={variant}
                variant={selectedVariant === variant ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVariant(variant as RegistrationsVariant)}
              >
                {variant}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {typeof props.error !== "undefined" ? (
        <RecentRegistrations error={props.error} />
      ) : (
        <RecentRegistrations
          ensIndexerConfig={props.ensIndexerConfig}
          realtimeProjection={props.realtimeProjection}
        />
      )}
    </section>
  );
}
