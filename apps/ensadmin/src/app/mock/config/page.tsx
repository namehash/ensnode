"use client";

import {
  ENSNodeConfigInfo,
} from "@/components/indexing-status/config-info";
import mockDataJson from "./data.json";
import {deserializeENSIndexerPublicConfig, SerializedENSIndexerPublicConfig} from "@ensnode/ensnode-sdk";
import {useMemo, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import Link from "next/link";

const mockConfigData = mockDataJson as Record<string, SerializedENSIndexerPublicConfig>;

type ConfigVariant = keyof typeof mockConfigData;

export default function MockConfigPage() {
  const [selectedConfig, setSelectedConfig] = useState<ConfigVariant>("Alpha Mainnet");
  const {deserializedConfig, validationError} = useMemo(() => {
      try {
          const config = deserializeENSIndexerPublicConfig(mockConfigData[selectedConfig]);
          return {deserializedConfig: config, validationError: null};
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown config validation error";
          return {deserializedConfig: null, validationError: errorMessage};
      }
  }, [selectedConfig])

  const headerStyles = "font-semibold leading-normal text-black";

  return (
    <section className="flex flex-col gap-6 p-6">
        <Card>
            <CardHeader>
                <CardTitle>Mock: ENSNode Public Config</CardTitle>
                <CardDescription>Select a mock config info variant</CardDescription>
            </CardHeader>

            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(mockConfigData).map((variant) => (
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

        {deserializedConfig &&
            <>
                <ENSNodeConfigInfo ensIndexerConfig={deserializedConfig} />
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
