"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SerializedENSIndexerPublicConfig,
  deserializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { useMemo, useState } from "react";
import mockDataJson from "./data.json";
import {IndexingStatusPlaceholder} from "@/components/indexing-status/indexing-status-placeholder";
import {ENSNodeConfigInfoError, ENSNodeConfigInfo} from "@/components/indexing-status/config-info";

const mockConfigData = mockDataJson as Record<string, SerializedENSIndexerPublicConfig>;

type LoadingVariant = "Loading" | "Loading Error";
type ConfigVariant = keyof typeof mockConfigData | LoadingVariant;

export default function MockConfigPage() {
  const [selectedConfig, setSelectedConfig] = useState<ConfigVariant>("Alpha Mainnet");
  const { deserializedConfig, validationError } = useMemo(() => {
    if (selectedConfig === "Loading" || selectedConfig === "Loading Error" ){
      return {deserializedConfig: null, validationError: null}
    }

    try {
      const config = deserializeENSIndexerPublicConfig(mockConfigData[selectedConfig]);
      return { deserializedConfig: config, validationError: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown config validation error";
      return { deserializedConfig: null, validationError: errorMessage };
    }
  }, [selectedConfig]);

  return (
    <section className="flex flex-col gap-6 p-6">
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

      {validationError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Mock JSON Data Validation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{validationError}</pre>
          </CardContent>
        </Card>
      )}

      {deserializedConfig && <ENSNodeConfigInfo ensIndexerConfig={deserializedConfig} />}

      {selectedConfig === "Loading" && <IndexingStatusPlaceholder />}

      {selectedConfig === "Loading Error" && <ENSNodeConfigInfoError />}
    </section>
  );
}
