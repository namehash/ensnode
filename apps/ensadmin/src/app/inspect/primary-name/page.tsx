"use client";

import { AddressDisplay, getChainName } from "@namehash/namehash-ui";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useDebouncedValue } from "rooks";
import { type Address, isAddress } from "viem";

import {
  DatasourceNames,
  type ENSNamespaceId,
  ENSNamespaceIds,
  maybeGetDatasource,
} from "@ensnode/datasources";
import { usePrimaryName } from "@ensnode/ensnode-react";
import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";

import { RenderRequestsOutput } from "@/app/inspect/_components/render-requests-output";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";

import { EXAMPLE_ADDRESSES } from "../_lib/example-addresses";

const getENSIP19SupportedChainIds = (namespace: ENSNamespaceId) =>
  [
    maybeGetDatasource(namespace, DatasourceNames.ReverseResolverBase),
    maybeGetDatasource(namespace, DatasourceNames.ReverseResolverLinea),
    maybeGetDatasource(namespace, DatasourceNames.ReverseResolverOptimism),
    maybeGetDatasource(namespace, DatasourceNames.ReverseResolverArbitrum),
    maybeGetDatasource(namespace, DatasourceNames.ReverseResolverScroll),
  ]
    .filter((ds) => ds !== undefined)
    .map((ds) => ds.chain.id);

// TODO: showcase current ENSNode configuration and viable acceleration pathways?
// TODO: use shadcn/form, react-hook-form, and zod to make all of this nicer aross the board
// TODO: sync form state to query params, current just defaulting is supported
export default function ResolvePrimaryNameInspector() {
  const searchParams = useSearchParams();

  const namespace = useActiveNamespace();
  const exampleAddresses = useMemo(
    () => getNamespaceSpecificValue(namespace, EXAMPLE_ADDRESSES),
    [namespace],
  );

  const [address, setAddress] = useState(
    searchParams.get("address") || exampleAddresses[0].address,
  );
  const [chainId, setChainId] = useState(searchParams.get("chainId") || "1");
  const [debouncedAddress] = useDebouncedValue(address, 150);

  const additionalChainIds = getENSIP19SupportedChainIds(namespace);

  const canQuery = !!debouncedAddress && isAddress(debouncedAddress);

  const accelerated = usePrimaryName({
    address: debouncedAddress as Address,
    chainId: Number(chainId),
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

  const unaccelerated = usePrimaryName({
    address: debouncedAddress as Address,
    chainId: Number(chainId),
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
          <CardTitle>Primary Name Inspector</CardTitle>
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
            <Label htmlFor="chainId" className="flex-1 flex flex-col gap-1">
              ENSIP-19 Chain ID
              <Select value={chainId} onValueChange={setChainId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (Default EVM Chain Address)</SelectItem>
                  <SelectItem value="1">1 (ENS Root Chain)</SelectItem>
                  {additionalChainIds.map((chainId) => (
                    <SelectItem key={chainId} value={chainId.toString()}>
                      {chainId} ({getChainName(chainId)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Label>
          </div>
          <div className="flex flex-col gap-2 justify-center">
            <span className="text-sm font-medium leading-none">Examples:</span>
            {/* -mx-6 px-6 insets the scroll container against card for prettier scrolling */}
            <div className="flex flex-row overflow-x-scroll gap-2 no-scrollbar -mx-6 px-6">
              {exampleAddresses.map(({ address, name }) => (
                <Pill
                  key={address}
                  onClick={() => {
                    setAddress(address);
                  }}
                  className="font-mono"
                >
                  <AddressDisplay address={address} /> ({name})
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
        dataKey="name"
        accelerated={accelerated}
        unaccelerated={unaccelerated}
      />
    </div>
  );
}
