"use client";

import { AddressDisplay } from "@namehash/namehash-ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "rooks";
import { type Address, isAddress } from "viem";

import { usePrimaryNames } from "@ensnode/ensnode-react";
import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";

import { RenderRequestsOutput } from "@/app/inspect/_components/render-requests-output";
import { ResolveButton } from "@/app/inspect/_components/resolve-button";
import { Pill } from "@/components/pill";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

import { EXAMPLE_ADDRESSES } from "../_lib/example-addresses";

// TODO: showcase current ENSNode configuration and viable acceleration pathways?
// TODO: use shadcn/form, react-hook-form, and zod to make all of this nicer aross the board
// TODO: sync form state to query params, current just defaulting is supported
export default function ResolvePrimaryNameInspector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  const namespace = useActiveNamespace();
  const exampleAddresses = useMemo(
    () => getNamespaceSpecificValue(namespace, EXAMPLE_ADDRESSES),
    [namespace],
  );

  const addressFromQuery = searchParams.get("address")?.trim() || null;

  const [address, setAddress] = useState(addressFromQuery || exampleAddresses[0].address);
  const [debouncedAddress] = useDebouncedValue(address, 150);

  useEffect(() => {
    setAddress(addressFromQuery ?? exampleAddresses[0].address);
  }, [addressFromQuery, exampleAddresses]);

  const navigateToAddress = (addr: Address) => {
    setAddress(addr);
    const path = `/inspect/primary-names?address=${encodeURIComponent(addr)}`;
    const href = retainCurrentRawConnectionUrlParam(path);
    router.push(href);
  };

  const validAddress: Address | null =
    debouncedAddress && isAddress(debouncedAddress) ? debouncedAddress : null;

  const accelerated = usePrimaryNames({
    address: validAddress,
    accelerate: true,
    trace: true,
    query: {
      enabled: !!validAddress,
      staleTime: 0,
      refetchInterval: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  });

  const unaccelerated = usePrimaryNames({
    address: validAddress,
    accelerate: false,
    trace: true,
    query: {
      enabled: !!validAddress,
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
            <Label htmlFor="name" className="flex-2 flex flex-col gap-1">
              EVM Address
              <Input
                id="name"
                placeholder={exampleAddresses[0].address}
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
              {exampleAddresses.map(({ address: exampleAddress, name }) => (
                <Pill
                  key={exampleAddress}
                  onClick={() => navigateToAddress(exampleAddress)}
                  className="font-mono"
                >
                  <AddressDisplay address={exampleAddress} /> ({name})
                </Pill>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <ResolveButton
            canResolve={isAddress(address.trim())}
            hasChanged={address.trim() !== addressFromQuery}
            onRefetch={refetch}
            onNavigate={() => navigateToAddress(address.trim() as Address)}
          />
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
