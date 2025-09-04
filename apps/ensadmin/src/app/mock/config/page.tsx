"use client";

import {
  FigmaBasedDependencyInfo,
  FigmaEvolutionDependencyInfo,
} from "@/app/mock/config/designs";
import { ENSIndexerDependencyInfo } from "@/components/indexing-status/dependecy-info";
import { cn } from "@/lib/utils";
import mockDataJson from "./data.json";
import {deserializeENSIndexerPublicConfig, SerializedENSIndexerPublicConfig} from "@ensnode/ensnode-sdk";
import {useMemo} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import Link from "next/link";

const mockConfigData = mockDataJson as Record<string, SerializedENSIndexerPublicConfig>;

type ConfigVariant = keyof typeof mockConfigData;

export default function StatusMockDependencyInfoPage() {
  const {deserializedConfig, validationError} = useMemo(() => {
      try {
          const config = deserializeENSIndexerPublicConfig(mockConfigData["Alpha Mainnet"]);
          return {deserializedConfig: config, validationError: null};
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown config validation error";
          return {deserializedConfig: null, validationError: errorMessage};
      }
  }, [])

  const headerStyles = "font-semibold leading-normal text-black";

  return (
    <section className="flex flex-col gap-6 p-6">
      <h1 className={cn(headerStyles, "text-xl")}>New "Dependency Info" design proposals</h1>
      {contentSeparator}

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

        {deserializedConfig &&
            <>
                <h1 className={cn(headerStyles, "text-lg")}>Current production version</h1>
                <ENSIndexerDependencyInfo ensIndexerConfig={deserializedConfig} />
                {contentSeparator}
            </>
        }

        {deserializedConfig &&
            <>
                <h1 className={cn(headerStyles, "text-lg")}>Version strictly based on Figma</h1>
                <FigmaBasedDependencyInfo ensIndexerConfig={deserializedConfig} />
                {contentSeparator}
            </>
        }

        {deserializedConfig &&
            <>
                <h1 className={cn(headerStyles, "text-lg")}>Evolution of Figma-based design</h1>
                <FigmaEvolutionDependencyInfo ensIndexerConfig={deserializedConfig} />
                {contentSeparator}
            </>
        }
        <Button asChild variant="default" >
            <Link href="/mock">Back to mock list</Link>
        </Button>
    </section>
  );
}

const contentSeparator = <span className="w-full self-stretch h-[1px] bg-gray-300" />;
