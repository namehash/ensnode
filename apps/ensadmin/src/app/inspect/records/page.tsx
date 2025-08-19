"use client";

import { RenderRequestsOutput } from "@/app/inspect/_components/render-requests-output";
import { CodeBlock } from "@/components/code-block";
import { LoadingSpinner } from "@/components/loading-spinner";
import { TraceRenderer } from "@/components/tracing/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecords } from "@ensnode/ensnode-react";
import { DEFAULT_RECORDS_SELECTION } from "@ensnode/ensnode-sdk";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedValue } from "rooks";

// TODO: use shadcn/form, react-hook-form, and zod to make all of this nicer aross the board
// TODO: sync form state to query params, current just defaulting is supported
export default function ResolveRecordsInspector() {
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("name") || "vitalik.eth");
  const [debouncedName] = useDebouncedValue(name, 150);

  const canQuery = !!debouncedName && debouncedName.length > 0;

  const accelerated = useRecords({
    name: debouncedName,
    accelerate: true,
    selection: DEFAULT_RECORDS_SELECTION,
    trace: true,
    query: {
      enabled: canQuery,
      staleTime: 0,
      refetchInterval: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  });

  const unaccelerated = useRecords({
    name: debouncedName,
    accelerate: false,
    selection: DEFAULT_RECORDS_SELECTION,
    trace: true,
    query: {
      enabled: canQuery,
      staleTime: 0,
      refetchInterval: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  });

  const refetch = () => {
    accelerated.refetch();
    unaccelerated.refetch();
  };

  return (
    <main className="flex flex-col gap-4 p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Record Resolution Inspector</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <Label htmlFor="name" className="w-full max-w-64 flex flex-col gap-1">
              ENS Name
              <Input
                id="name"
                placeholder="vitalik.eth"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                autoFocus
                data-1p-ignore
              />
            </Label>
            <Label htmlFor="selection" className="flex-1 flex flex-col gap-1">
              Records Selection
              <Input id="selection" value={JSON.stringify(DEFAULT_RECORDS_SELECTION)} disabled />
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => refetch()}>Refresh</Button>
        </CardFooter>
      </Card>

      <RenderRequestsOutput
        dataKey="records"
        accelerated={accelerated}
        unaccelerated={unaccelerated}
      />
    </main>
  );
}
