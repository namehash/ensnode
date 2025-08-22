"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SerializedENSIndexerOverallIndexingStatus,
  deserializeENSIndexerIndexingStatus,
} from "@ensnode/ensnode-sdk";
import { useMemo, useState } from "react";
import { MockIndexingStatusDisplayWithProps } from "./indexing-status-display";

import mockDataJson from "./data.json";

const mockStatusData = mockDataJson as Record<string, SerializedENSIndexerOverallIndexingStatus>;

type StatusVariant = keyof typeof mockStatusData;

export default function StatusMockPage() {
  const [selectedVariant, setSelectedVariant] = useState<StatusVariant>("unstarted");

  const { deserializedStatus, validationError } = useMemo(() => {
    try {
      const status = deserializeENSIndexerIndexingStatus(mockStatusData[selectedVariant]);
      return { deserializedStatus: status, validationError: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown validation error";
      return { deserializedStatus: null, validationError: errorMessage };
    }
  }, [selectedVariant]);

  return (
    <section className="flex flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Mock: Indexing Status</CardTitle>
          <CardDescription>Select a mock indexing status scenario</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
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

      {deserializedStatus && (
        <MockIndexingStatusDisplayWithProps indexingStatus={deserializedStatus} />
      )}
    </section>
  );
}
