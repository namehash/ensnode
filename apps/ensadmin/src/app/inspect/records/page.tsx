"use client";

import { RenderRequestsOutput } from "@/app/inspect/_components/render-requests-output";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/radix-ui/label";
import { useRecords } from "@ensnode/ensnode-react";
import { DefaultRecordsSelection } from "@ensnode/ensnode-sdk";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedValue } from "rooks";

const EXAMPLE_INPUT = [
  "vitalik.eth",
  "gregskril.eth",
  "katzman.base.eth",
  "jesse.base.eth",
  "alain.linea.eth",
  "goinfrex.linea.eth",
  "gift.box",
  "barmstrong.cb.id",
  "argent.xyz",
  "lens.xyz",
  "🔥🔥🔥🔥🔥.eth",
];

// TODO: showcase current ENSNode configuration and viable acceleration pathways?
// TODO: use shadcn/form, react-hook-form, and zod to make all of this nicer aross the board
// TODO: sync form state to query params, current just defaulting is supported
export default function ResolveRecordsInspector() {
  const searchParams = useSearchParams();

  const [name, setName] = useState(searchParams.get("name") || EXAMPLE_INPUT[0]);
  const [debouncedName] = useDebouncedValue(name, 150);

  const canQuery = !!debouncedName && debouncedName.length > 0;

  // TODO: switch on connected ensnode's configured namespace
  const selection = DefaultRecordsSelection.mainnet;

  const accelerated = useRecords({
    name: debouncedName,
    accelerate: true,
    selection,
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
    selection,
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
    <div className="flex flex-col gap-4 p-4 min-w-0">
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
                placeholder={EXAMPLE_INPUT[0]}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                autoFocus
                data-1p-ignore
              />
            </Label>
            <Label htmlFor="selection" className="flex-1 flex flex-col gap-1">
              Records Selection
              <Input id="selection" value={JSON.stringify(selection)} disabled />
            </Label>
          </div>
          <div className="flex flex-col gap-2 justify-center">
            <span className="text-sm font-medium leading-none">Examples:</span>
            {/* -mx-6 px-6 insets the scroll container against card for prettier scrolling */}
            <div className="flex flex-row overflow-x-scroll gap-2 no-scrollbar -mx-6 px-6">
              {EXAMPLE_INPUT.map((name) => (
                <Pill key={name} onClick={() => setName(name)} className="font-mono">
                  {name}
                </Pill>
              ))}
            </div>
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
    </div>
  );
}
