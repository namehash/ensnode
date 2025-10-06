"use client";
import { RecentRegistrations, RecentRegistrationsProps } from "@/components/recent-registrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SerializedENSIndexerOverallIndexingStatus,
  SerializedENSIndexerPublicConfig,
  deserializeENSIndexerIndexingStatus,
  deserializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { useMemo, useState } from "react";
import mockDataJson from "./data.json";

const mockIndexerData = mockDataJson as Record<
  string,
  {
    ensIndexerConfig: SerializedENSIndexerPublicConfig;
    indexingStatus: SerializedENSIndexerOverallIndexingStatus;
  }
>;

type LoadingVariant = "Loading" | "Loading Error";
type RegistrationsVariant = keyof typeof mockIndexerData | LoadingVariant;

const DEFAULT_VARIANT = "following";
export default function MockRegistrationsPage() {
  // TODO: Add a serialization error variant,
  //  once a custom API for querying registration data is implemented.
  const [selectedVariant, setSelectedVariant] = useState<RegistrationsVariant>(DEFAULT_VARIANT);
  const props: RecentRegistrationsProps = useMemo(() => {
    switch (selectedVariant) {
      case "Loading":
        return {};

      case "Loading Error":
        return {
          error: {
            title: "RecentRegistrations Error",
            description: "Failed to fetch ENSIndexerConfig or IndexingStatus.",
          },
        };

      default:
        try {
          const config = deserializeENSIndexerPublicConfig(
            mockIndexerData[selectedVariant].ensIndexerConfig,
          );
          const indexingStatus = deserializeENSIndexerIndexingStatus(
            mockIndexerData[selectedVariant].indexingStatus,
          );
          return { ensIndexerConfig: config, indexingStatus: indexingStatus };
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown RecentRegistrations mock data deserialization error";
          return {
            error: { title: "Deserialization Error", description: errorMessage },
          };
        }
    }
  }, [selectedVariant]);

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle>Mock: RecentRegistrations</CardTitle>
          <CardDescription>Select a mock RecentRegistrations variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...Object.keys(mockIndexerData), "Loading", "Loading Error"].map((variant) => (
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

      <RecentRegistrations {...props} />
    </section>
  );
}
