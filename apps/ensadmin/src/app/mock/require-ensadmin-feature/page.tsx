"use client";

import { useState } from "react";

import { RequireENSAdminFeatureView } from "@/components/require-ensadmin-feature";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureStatus } from "@/hooks/active/use-ensadmin-features";

const variants: Map<string, FeatureStatus> = new Map([
  ["connecting", { type: "connecting" }],
  [
    "error",
    {
      type: "error",
      reason: "ENSNode config could not be fetched successfully.",
    },
  ],
  [
    "not-ready",
    {
      type: "not-ready",
      reason:
        "The Registrar Actions API will be available once the omnichain indexing status reaches: Indexing Realtime.",
    },
  ],
  [
    "unsupported",
    {
      type: "unsupported",
      reason:
        "The Registrar Actions API requires the following plugins to be activated: subgraph, referrals.",
    },
  ],
  ["supported", { type: "supported" }],
]);

const variantIds = [...variants.keys()];

export default function MockRequireENSAdminFeaturePage() {
  const [selectedVariantId, setSelectedVariantId] = useState(variantIds[0]);
  const selectedVariant = variants.get(selectedVariantId);

  if (!selectedVariant) {
    return <>No variant defined for variant id "{selectedVariantId}".</>;
  }

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Mock: RequireENSAdminFeature</CardTitle>
          <CardDescription>Select a FeatureStatus variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variantIds.map((variantId) => (
              <Button
                key={variantId}
                variant={selectedVariantId === variantId ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVariantId(variantId)}
              >
                {variantId}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <RequireENSAdminFeatureView title="Example Feature API" status={selectedVariant}>
            <div className="p-6 text-center text-muted-foreground">
              Feature content rendered successfully.
            </div>
          </RequireENSAdminFeatureView>
        </CardContent>
      </Card>
    </section>
  );
}
