"use client";

import { AddressDisplay, getChainName } from "@namehash/namehash-ui";
import type { Address, DefaultableChainId } from "enssdk";
import { DEFAULT_EVM_CHAIN_ID } from "enssdk";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "rooks";
import { isAddress } from "viem";

import { getENSRootChainId } from "@ensnode/datasources";
import { usePrimaryName } from "@ensnode/ensnode-react";
import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";
import { makeDefaultableChainIdStringSchema } from "@ensnode/ensnode-sdk/internal";

import { RenderRequestsOutput } from "@/app/inspect/_components/render-requests-output";
import { ResolveButton } from "@/app/inspect/_components/resolve-button";
import { Pill } from "@/components/pill";
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
import { useActiveEnsNodeStackInfo } from "@/hooks/active/use-active-ensnode-stack-info";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { getENSIP19SupportedChainIds } from "@/lib/get-ensip19-supported-chain-ids";

import { EXAMPLE_ADDRESSES } from "../_lib/example-addresses";

const defaultableChainIdStringSchema = makeDefaultableChainIdStringSchema("chainId");

// TODO: showcase current ENSNode configuration and viable acceleration pathways?
// TODO: use shadcn/form, react-hook-form, and zod to make all of this nicer aross the board
// TODO: sync form state to query params, current just defaulting is supported
export default function ResolvePrimaryNameInspector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  const { namespace } = useActiveEnsNodeStackInfo().ensIndexer;
  const exampleAddresses = useMemo(
    () => getNamespaceSpecificValue(namespace, EXAMPLE_ADDRESSES),
    [namespace],
  );

  const addressFromQuery = searchParams.get("address")?.trim() || null;
  const chainIdParam = searchParams.get("chainId");
  const defaultChainId = getENSRootChainId(namespace) as DefaultableChainId;
  const chainIdFromQuery: DefaultableChainId = chainIdParam
    ? (defaultableChainIdStringSchema.safeParse(chainIdParam).data ?? defaultChainId)
    : defaultChainId;

  const [address, setAddress] = useState(addressFromQuery || exampleAddresses[0].address);
  const [chainId, setChainId] = useState<DefaultableChainId>(chainIdFromQuery);
  const [debouncedAddress] = useDebouncedValue(address, 150);

  useEffect(() => {
    setAddress(addressFromQuery ?? exampleAddresses[0].address);
  }, [addressFromQuery, exampleAddresses]);

  useEffect(() => {
    setChainId(chainIdFromQuery);
  }, [chainIdFromQuery]);

  const navigateToAddress = (addr: Address, chain: DefaultableChainId) => {
    setAddress(addr);
    setChainId(chain);
    const path = `/inspect/primary-name?address=${encodeURIComponent(
      addr,
    )}&chainId=${encodeURIComponent(String(chain))}`;
    const href = retainCurrentRawConnectionUrlParam(path);
    router.push(href);
  };

  const additionalChainIds = getENSIP19SupportedChainIds(namespace);

  const validAddress: Address | null =
    debouncedAddress && isAddress(debouncedAddress) ? debouncedAddress : null;

  const accelerated = usePrimaryName({
    address: validAddress,
    chainId,
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

  const unaccelerated = usePrimaryName({
    address: validAddress,
    chainId,
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
              <Select
                value={String(chainId)}
                onValueChange={(val) => setChainId(defaultableChainIdStringSchema.parse(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(DEFAULT_EVM_CHAIN_ID)}>
                    {DEFAULT_EVM_CHAIN_ID} (Default EVM Chain Address)
                  </SelectItem>
                  <SelectItem value={String(defaultChainId)}>
                    {defaultChainId} ({getChainName(defaultChainId)} — ENS Root Chain)
                  </SelectItem>
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
              {exampleAddresses.map(({ address: exampleAddress, name }) => (
                <Pill
                  key={exampleAddress}
                  onClick={() => navigateToAddress(exampleAddress, chainId)}
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
            hasChanged={address.trim() !== addressFromQuery || chainId !== chainIdFromQuery}
            onRefetch={refetch}
            onNavigate={() => navigateToAddress(address.trim() as Address, chainId)}
          />
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
