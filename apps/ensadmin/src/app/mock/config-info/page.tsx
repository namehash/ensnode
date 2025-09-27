"use client";

import { ENSNodeConfigInfo } from "@/components/indexing-status/config-info";
import { ENSNodeConfigProps } from "@/components/indexing-status/config-info/config-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SerializedENSIndexerPublicConfig,
  deserializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { useMemo, useState } from "react";
import mockDataJson from "./data.json";

const mockConfigData = mockDataJson as Record<string, SerializedENSIndexerPublicConfig>;

type LoadingVariant = "Loading" | "Loading Error";
type ConfigVariant = keyof typeof mockConfigData | LoadingVariant;

const DEFAULT_VARIANT = "Alpha Mainnet";
export default function MockConfigPage() {
  const [selectedConfig, setSelectedConfig] = useState<ConfigVariant>(DEFAULT_VARIANT);
  const props: ENSNodeConfigProps = useMemo(() => {
    switch (selectedConfig) {
      case "Loading":
        return {};

      case "Loading Error":
        return {
          error: {
            title: "ENSNodeConfigInfo Error",
            description: "Failed to fetch ENSIndexer Config.",
          },
        };

      default:
        try {
          const config = deserializeENSIndexerPublicConfig(mockConfigData[selectedConfig]);
          return { ensIndexerConfig: config };
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown ENSIndexerPublicConfig deserialization error";
          return {
            error: { title: "Deserialization Error", description: errorMessage },
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

      <ENSNodeConfigInfo {...props} />
    </section>
  );
}
