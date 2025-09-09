"use client";

import { ENSNodeConfigInfo } from "@/components/indexing-status/config-info";
import { ENSNodeConfigProps } from "@/components/indexing-status/config-info/config-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorInfo } from "@/components/ui/error-info";
import {
  SerializedENSIndexerPublicConfig,
  deserializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { useMemo, useState } from "react";
import mockDataJson from "./data.json";

const mockConfigData = mockDataJson as Record<string, SerializedENSIndexerPublicConfig>;

type LoadingVariant = "Loading" | "Loading Error";
type ConfigVariant = keyof typeof mockConfigData | LoadingVariant;

export default function MockConfigPage() {
  const [selectedConfig, setSelectedConfig] = useState<ConfigVariant>("Alpha Mainnet");
  const { props, deserializationError } = useMemo(() => {
    switch (selectedConfig) {
      case "Loading":
        return { props: { ensIndexerConfig: null }, deserializationError: null };

      case "Loading Error":
        return {
          props: { ensIndexerConfig: null, error: "Failed to fetch ENSIndexer Config." },
          deserializationError: null,
        };

      default:
        try {
          const config = deserializeENSIndexerPublicConfig(mockConfigData[selectedConfig]);
          return { props: { ensIndexerConfig: config }, deserializationError: null };
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown ENSIndexerPublicConfig deserialization error";
          return {
            props: { ensIndexerConfig: null },
            deserializationError: errorMessage,
          };
        }
    }
  }, [selectedConfig]);

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle>Mock: ENSNodeConfigInfo</CardTitle>
          <CardDescription>Select a mock ENSNodeConfigInfo variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...Object.keys(mockConfigData), "Loading", "Loading Error"].map((variant) => (
              <Button
                key={variant}
                variant={selectedConfig === variant ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedConfig(variant as ConfigVariant)}
              >
                {variant}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {deserializationError ? (
        <ErrorInfo title="JSON Deserialization Error" description={deserializationError} />
      ) : (
        <ENSNodeConfigInfo {...(props as ENSNodeConfigProps)} />
      )}
    </section>
  );
}
