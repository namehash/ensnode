"use client";

import { useState } from "react";

import { ENSNamespaceIds } from "@ensnode/datasources";

import { DisplayRegistrarActionsPanel } from "@/components/registrar-actions/display-registrar-actions-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { variants } from "./mocks";

const variantIds = [...variants.keys()];

export default function MockRegistrarActionsPage() {
  const namespaceId = ENSNamespaceIds.Sepolia;
  const title = "Recent registrar actions";

  const [selectedVariantId, setSelectedVariantId] = useState(variantIds[0]);
  const selectedVariant = variants.get(selectedVariantId);

  if (!selectedVariant) {
    return <>No variant defined for variant id "{selectedVariantId}".</>;
  }

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Mock: RegistrarActions</CardTitle>
          <CardDescription>Select a mock RegistrarActions variant</CardDescription>
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
          <DisplayRegistrarActionsPanel
            namespaceId={namespaceId}
            title={title}
            registrarActions={selectedVariant}
          />
        </CardContent>
      </Card>{" "}
    </section>
  );
}
