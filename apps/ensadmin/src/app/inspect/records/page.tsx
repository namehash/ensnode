"use client";

import { CodeBlock } from "@/components/code-block";
import { LoadingSpinner } from "@/components/loading-spinner";
import { TraceRenderer } from "@/components/tracing/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecords } from "@ensnode/ensnode-react";
import { DEFAULT_RECORDS_SELECTION } from "@ensnode/ensnode-sdk";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedValue } from "rooks";

// TODO: use shadcn/form, react-hook-form, and zod to make all of this nicer aross the board
// TODO: sync form state to query params, current just defaulting is supported
// TODO: allow configuration of selection criteria
export default function ResolveRecordsInspector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("name") || "vitalik.eth");
  const [accelerate, setAccelerate] = useState(searchParams.get("accelerate") !== "false");

  const [debouncedName] = useDebouncedValue(name, 150);

  const canQuery = !!debouncedName && debouncedName.length > 0;

  const { data, error, isPending, isFetched } = useRecords({
    name: debouncedName,
    accelerate,
    selection: DEFAULT_RECORDS_SELECTION,
    trace: true,
    query: {
      enabled: canQuery,
      retry: false,
    },
  });

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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accelerate"
              checked={accelerate}
              onCheckedChange={(checked) => setAccelerate(checked as boolean)}
            />
            <label
              htmlFor="accelerate"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable Protocol Acceleration
            </label>
          </div>
        </CardContent>
      </Card>
      {isFetched && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>ENSNode Response</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              if (error) return <p>{error.message}</p>;
              if (isPending)
                return (
                  <div className="flex flex-row justify-center p-8">
                    <LoadingSpinner className="h-8 w-8" />
                  </div>
                );

              return <CodeBlock>{JSON.stringify(data.records, null, 2)}</CodeBlock>;
            })()}
          </CardContent>
        </Card>
      )}
      {data?.trace && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Protocol Tracing</CardTitle>
          </CardHeader>
          <CardContent>
            <TraceRenderer trace={data.trace} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
