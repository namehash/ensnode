"use client";

import { useMemo, useState } from "react";

import { deserializeEnsNodeStackInfo } from "@ensnode/ensnode-sdk";

import {
  DisplayEnsNodeStackInfo,
  DisplayEnsNodeStackInfoProps,
} from "@/components/connection/cards/ensnode-stack-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { mockSerializedEnsNodeStackInfo } from "./stack-info.mock";

type LoadingVariant = "Loading" | "Loading Error";
type Variants = keyof typeof mockSerializedEnsNodeStackInfo | LoadingVariant;

const DEFAULT_VARIANT: Variants = "Alpha Mainnet";
export default function MockEnsNodeStackInfoPage() {
  const [selectedConfig, setSelectedConfig] = useState<Variants>(DEFAULT_VARIANT);
  const props: DisplayEnsNodeStackInfoProps = useMemo(() => {
    switch (selectedConfig) {
      case "Loading":
        return { isLoading: true };

      case "Loading Error":
        return {
          error: {
            title: "EnsNodeStackInfo Error",
            description: "Failed to fetch EnsNodeStackInfo.",
          },
        };

      default:
        try {
          const ensNodeStackInfo = deserializeEnsNodeStackInfo(
            mockSerializedEnsNodeStackInfo[selectedConfig],
          );
          return {
            ensNodeStackInfo,
          } satisfies DisplayEnsNodeStackInfoProps;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown EnsNodeStackInfo deserialization error";
          return {
            error: {
              title: "EnsNodeStackInfo Deserialization Error",
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
          <CardTitle className="text-2xl leading-normal">Mock: EnsNodeStackInfo</CardTitle>
          <CardDescription>Select a mock EnsNodeStackInfo variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...Object.keys(mockSerializedEnsNodeStackInfo), "Loading", "Loading Error"].map(
              (variant) => (
                <Button
                  key={variant}
                  variant={selectedConfig === variant ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedConfig(variant as Variants)}
                >
                  {variant}
                </Button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      <DisplayEnsNodeStackInfo {...props} />
    </section>
  );
}
