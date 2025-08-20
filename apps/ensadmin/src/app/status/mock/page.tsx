"use client";

import { useState, useMemo } from "react";
import {
  deserializeENSIndexerIndexingStatus,
  SerializedENSIndexerOverallIndexingStatus,
  ENSIndexerPublicConfig,
  PluginName,
} from "@ensnode/ensnode-sdk";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndexingStatusDisplay } from "@/components/indexing-status";

import mockDataJson from "./data.json";

const mockStatusData = mockDataJson as Record<
  string,
  SerializedENSIndexerOverallIndexingStatus
>;

type StatusVariant = keyof typeof mockStatusData;

const mockConfig: ENSIndexerPublicConfig = {
  namespace: ENSNamespaceIds.Mainnet,
  ensAdminUrl: new URL("https://admin.ensnode.io"),
  ensNodePublicUrl: new URL("https://ensnode.run.tko.box"),
  databaseSchemaName: "aug20--d09f7d77ec32aba8c789c8ac059241b45b99addc",
  plugins: [PluginName.Subgraph],
  healReverseAddresses: false,
  indexAdditionalResolverRecords: false,
  indexedChainIds: new Set([1, 10, 8453, 59144, 11155111]), // masp to mocks tko sent
  isSubgraphCompatible: false,
  dependencyInfo: {
    nodejs: "22.11.0",
    ponder: "0.11.43",
    ensRainbow: "0.33.0",
    ensRainbowSchema: 2,
  },
};

export default function StatusMockPage() {
  const [selectedVariant, setSelectedVariant] =
    useState<StatusVariant>("unstarted");

  const { deserializedStatus, validationError } = useMemo(() => {
    try {
      const status = deserializeENSIndexerIndexingStatus(
        mockStatusData[selectedVariant]
      );
      return { deserializedStatus: status, validationError: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown validation error";
      return { deserializedStatus: null, validationError: errorMessage };
    }
  }, [selectedVariant]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-wrap gap-2 mb-4 p-6">
        {Object.keys(mockStatusData).map((variant) => (
          <Button
            key={variant}
            variant={selectedVariant === variant ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedVariant(variant as StatusVariant)}
          >
            {variant}
          </Button>
        ))}
      </div>

      {validationError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Validation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">
              {validationError}
            </pre>
          </CardContent>
        </Card>
      )}

      {deserializedStatus && (
        <IndexingStatusDisplay
          ensIndexerConfig={mockConfig}
          indexingStatus={deserializedStatus}
          showRecentRegistrations={false}
        />
      )}
    </div>
  );
}
