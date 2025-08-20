"use client";

import { RenderRequestsOutput } from "@/app/inspect/_components/render-requests-output";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePrimaryNames } from "@ensnode/ensnode-react";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedValue } from "rooks";
import { Address } from "viem";

const EXAMPLE_INPUT = [
  "0x179A862703a4adfb29896552DF9e307980D19285", // greg
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik
  "0x2211d1D0020DAEA8039E46Cf1367962070d77DA9", // jesse
];

// TODO: showcase current ENSNode configuration and viable acceleration pathways?
// TODO: use shadcn/form, react-hook-form, and zod to make all of this nicer aross the board
// TODO: sync form state to query params, current just defaulting is supported
export default function ResolvePrimaryNameInspector() {
  const searchParams = useSearchParams();

  const [address, setAddress] = useState(searchParams.get("address") || EXAMPLE_INPUT[0]);
  const [debouncedAddress] = useDebouncedValue(address, 150);

  const canQuery =
    !!debouncedAddress && debouncedAddress.length > 0 && debouncedAddress.startsWith("0x");

  const accelerated = usePrimaryNames({
    address: debouncedAddress as Address,
    accelerate: true,
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

  const unaccelerated = usePrimaryNames({
    address: debouncedAddress as Address,
    accelerate: false,
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
          <CardTitle>Primary Names Inspector</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <Label htmlFor="name" className="flex-[2] flex flex-col gap-1">
              EVM Address
              <Input
                id="name"
                placeholder={EXAMPLE_INPUT[0]}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="off"
                autoFocus
                data-1p-ignore
              />
            </Label>
          </div>
          <div className="flex flex-col gap-2 justify-center">
            <span className="text-sm font-medium leading-none">Examples:</span>
            {/* -mx-6 px-6 insets the scroll container against card for prettier scrolling */}
            <div className="flex flex-row overflow-x-scroll gap-2 no-scrollbar -mx-6 px-6">
              {EXAMPLE_INPUT.map((address) => (
                <Pill key={address} onClick={() => setAddress(address)} className="font-mono">
                  {address}
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
        dataKey="names"
        accelerated={accelerated}
        unaccelerated={unaccelerated}
      />
    </div>
  );
}
