import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { deserializeENSIndexerPublicConfig, type ENSApiPublicConfig } from "@ensnode/ensnode-sdk";

import { ENSNodeConfigInfoView } from "@/components/connection/config-info/config-info";
import type { ErrorInfoProps } from "@/components/error-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ENSNodeConfigInfoViewProps =
  | { ensApiPublicConfig: ENSApiPublicConfig; error?: never; isLoading?: never }
  | { ensApiPublicConfig?: never; error: ErrorInfoProps; isLoading?: never }
  | { ensApiPublicConfig?: never; error?: never; isLoading: true };

import mockDataJson from "@/lib/mock/config-info/data.json";

export const Route = createFileRoute("/mock/config-info")({
  component: MockConfigPage,
});

const mockConfigData = mockDataJson as Record<string, any>;

type LoadingVariant = "Loading" | "Loading Error";
type ConfigVariant = keyof typeof mockConfigData | LoadingVariant;

const DEFAULT_VARIANT = "Alpha Mainnet";

function MockConfigPage() {
  const [selectedConfig, setSelectedConfig] = useState<ConfigVariant>(DEFAULT_VARIANT);
  const props: ENSNodeConfigInfoViewProps = useMemo(() => {
    switch (selectedConfig) {
      case "Loading":
        return { isLoading: true };

      case "Loading Error":
        return {
          error: {
            title: "ENSNodeConfigInfo Error",
            description: "Failed to fetch ENSIndexer Config.",
          },
        };

      default:
        try {
          const ensIndexerPublicConfig = deserializeENSIndexerPublicConfig(
            mockConfigData[selectedConfig],
          );
          return { ensApiPublicConfig: { ensIndexerPublicConfig } };
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown ENSIndexerPublicConfig deserialization error";
          return {
            error: {
              title: "Deserialization Error",
              description: errorMessage,
            },
          };
        }
    }
  }, [selectedConfig]);

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Mock: ENSNodeConfigInfo</CardTitle>
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

      <ENSNodeConfigInfoView {...props} />
    </section>
  );
}
