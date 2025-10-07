"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { MockIndexingStatusDisplayWithProps } from "./indexing-status-display";

import {
  IndexingStatusResponseCodes,
  OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { indexingStatusResponseOkOmnichain } from "../indexing-status-api.mock";

export default function MockIndexingStatusPage() {
  const [selectedVariant, setSelectedVariant] = useState<OmnichainIndexingStatusId>(
    OmnichainIndexingStatusIds.Unstarted,
  );

  const { deserializedStatus, validationError } = useMemo(() => {
    try {
      const status = indexingStatusResponseOkOmnichain[selectedVariant];
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
          <CardTitle>Mock: IndexingStats</CardTitle>
          <CardDescription>Select a mock IndexingStats scenario</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              OmnichainIndexingStatusIds.Unstarted,
              OmnichainIndexingStatusIds.Backfill,
              OmnichainIndexingStatusIds.Following,
              OmnichainIndexingStatusIds.Completed,
            ].map((variant) => (
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

      {deserializedStatus?.responseCode === IndexingStatusResponseCodes.Ok && (
        <MockIndexingStatusDisplayWithProps
          realtimeProjection={deserializedStatus.realtimeProjection}
        />
      )}
    </section>
  );
}
