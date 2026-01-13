"use client";

import { getChainName } from "@namehash/namehash-ui";
import { useState } from "react";
import { type Address, isAddress } from "viem";

import { getENSNamespace, getENSRootChainId } from "@ensnode/datasources";
import {
  asLowerCaseAddress,
  type ChainId,
  DEFAULT_EVM_CHAIN_ID,
  type DefaultableChainId,
  type ENSNamespaceId,
  ENSNamespaceIds,
  type Identity,
  type Name,
  type NamedIdentity,
  type ResolutionStatusId,
  ResolutionStatusIds,
  type UnknownIdentity,
  type UnnamedIdentity,
  type UnresolvedIdentity,
  uniq,
} from "@ensnode/ensnode-sdk";

import { DisplayIdentity } from "@/components/identity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_NAMESPACE_ID: ENSNamespaceId = ENSNamespaceIds.Mainnet;
const DEFAULT_RESOLUTION_STATUS: ResolutionStatusId = ResolutionStatusIds.Named;
const DEFAULT_ADDRESS: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const DEFAULT_NAME: Name = "vitalik.eth";
const DEFAULT_WITH_LINK: boolean = true;
const DEFAULT_WITH_TOOLTIP: boolean = true;
const DEFAULT_WITH_AVATAR: boolean = true;

const getMockChainIds = (namespaceId: ENSNamespaceId): DefaultableChainId[] => {
  const allDataSourceChains = Object.values(getENSNamespace(namespaceId)).map(
    (datasource) => datasource.chain.id,
  );
  const exampleUnrecognizedChainId: ChainId = 12345;
  return uniq([DEFAULT_EVM_CHAIN_ID, ...allDataSourceChains, exampleUnrecognizedChainId]);
};

// TODO: Add query params for all the inputs to enable deep linking.
export default function MockDisplayIdentityPage() {
  const [selectedNamespaceId, setSelectedNamespaceId] =
    useState<ENSNamespaceId>(DEFAULT_NAMESPACE_ID);
  const [selectedChainId, setSelectedChainId] = useState<DefaultableChainId>(
    getENSRootChainId(selectedNamespaceId),
  );
  const [selectedResolutionStatus, setSelectedResolutionStatus] =
    useState<ResolutionStatusId>(DEFAULT_RESOLUTION_STATUS);
  const [selectedRawAddress, setSelectedRawAddress] = useState<string>(DEFAULT_ADDRESS);
  const [selectedRawName, setSelectedRawName] = useState<string>(DEFAULT_NAME);
  const [withLink, setWithLink] = useState<boolean>(DEFAULT_WITH_LINK);
  const [withTooltip, setWithTooltip] = useState<boolean>(DEFAULT_WITH_TOOLTIP);
  const [withAvatar, setWithAvatar] = useState<boolean>(DEFAULT_WITH_AVATAR);

  // fallback to selecting the default address if
  // selectedRawAddress is not a valid address
  let selectedAddress: Address;
  if (isAddress(selectedRawAddress, { strict: false })) {
    selectedAddress = selectedRawAddress;
  } else {
    selectedAddress = DEFAULT_ADDRESS;
  }

  // at a data-model level, we always represent addresses fully in lowercase.
  selectedAddress = asLowerCaseAddress(selectedAddress);

  // fallback to selecting the default name if
  // selectedRawName is an empty string
  const selectedName = selectedRawName !== "" ? selectedRawName : DEFAULT_NAME;

  // build Identity from selected values
  let selectedIdentity: Identity;
  switch (selectedResolutionStatus) {
    case ResolutionStatusIds.Unresolved:
      selectedIdentity = {
        resolutionStatus: selectedResolutionStatus,
        chainId: selectedChainId,
        address: selectedAddress,
      } satisfies UnresolvedIdentity;
      break;
    case ResolutionStatusIds.Named:
      selectedIdentity = {
        resolutionStatus: selectedResolutionStatus,
        chainId: selectedChainId,
        address: selectedAddress,
        name: selectedName,
      } satisfies NamedIdentity;
      break;
    case ResolutionStatusIds.Unnamed:
      selectedIdentity = {
        resolutionStatus: selectedResolutionStatus,
        chainId: selectedChainId,
        address: selectedAddress,
        name: null,
      } satisfies UnnamedIdentity;
      break;
    case ResolutionStatusIds.Unknown:
      selectedIdentity = {
        resolutionStatus: selectedResolutionStatus,
        chainId: selectedChainId,
        address: selectedAddress,
      } satisfies UnknownIdentity;
      break;
  }

  return (
    <section className="flex flex-col lg:flex-row gap-6 p-6 max-sm:p-4">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Mock: DisplayIdentity</CardTitle>
          <CardDescription>Select a mock DisplayIdentity variant</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="namespace-select" className="text-sm font-medium leading-none">
                    ENS Namespace
                  </label>
                  <Select
                    value={selectedNamespaceId}
                    onValueChange={(namespaceId) => {
                      setSelectedNamespaceId(namespaceId as ENSNamespaceId);
                      setSelectedChainId(getENSRootChainId(namespaceId as ENSNamespaceId));
                    }}
                  >
                    <SelectTrigger id="namespace-select" className="w-[250px]">
                      <SelectValue placeholder="Select a namespace" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ENSNamespaceIds).map((namespaceId) => (
                        <SelectItem key={namespaceId} value={namespaceId}>
                          {namespaceId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="identity-ref-select" className="text-sm font-medium leading-none">
                    ResolutionStatusId
                  </label>
                  <Select
                    value={selectedResolutionStatus}
                    onValueChange={(resolutionStatusId) =>
                      setSelectedResolutionStatus(resolutionStatusId as ResolutionStatusId)
                    }
                  >
                    <SelectTrigger id="identity-ref-select" className="w-[250px]">
                      <SelectValue placeholder="Select a ResolutionStatusId" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ResolutionStatusIds).map((resolutionStatusId) => (
                        <SelectItem key={resolutionStatusId} value={resolutionStatusId}>
                          {resolutionStatusId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="chain-select" className="text-sm font-medium leading-none">
                    Chain
                  </label>
                  <Select
                    value={selectedChainId.toString()}
                    onValueChange={(chainId) => setSelectedChainId(Number(chainId) as ChainId)}
                  >
                    <SelectTrigger id="chain-select" className="w-[250px]">
                      <SelectValue placeholder="Select a chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {getMockChainIds(selectedNamespaceId).map((chainId) => (
                        <SelectItem key={chainId} value={chainId.toString()}>
                          {chainId === DEFAULT_EVM_CHAIN_ID
                            ? "Default EVM Chain"
                            : getChainName(chainId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="address-input" className="text-sm font-medium leading-none">
                    Address
                  </label>
                  <Input
                    id="address-input"
                    value={selectedRawAddress}
                    onChange={(e) => setSelectedRawAddress(e.target.value)}
                    className="w-[400px]"
                    placeholder={DEFAULT_ADDRESS}
                  />
                  {selectedAddress.toLowerCase() !== selectedRawAddress.toLowerCase() && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      <p className="font-medium">
                        Falling back to default address: "{selectedAddress}"
                      </p>
                    </div>
                  )}
                </div>
                {selectedResolutionStatus === ResolutionStatusIds.Named && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name-input" className="text-sm font-medium leading-none">
                      Name
                    </label>
                    <Input
                      id="name-input"
                      value={selectedRawName}
                      onChange={(e) => setSelectedRawName(e.target.value)}
                      className="w-[250px]"
                      placeholder={DEFAULT_NAME}
                    />
                    {selectedName !== selectedRawName && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <p className="font-medium">
                          Falling back to default name: "{selectedName}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>UI Variation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="withLink"
                    checked={withLink}
                    onCheckedChange={(checked) =>
                      setWithLink(checked === "indeterminate" ? true : checked)
                    }
                  />
                  <label
                    htmlFor="withLink"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    With Link
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="withTooltip"
                    checked={withTooltip}
                    onCheckedChange={(checked) =>
                      setWithTooltip(checked === "indeterminate" ? true : checked)
                    }
                  />
                  <label
                    htmlFor="withTooltip"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    With Tooltip
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="withAvatar"
                    checked={withAvatar}
                    onCheckedChange={(checked) =>
                      setWithAvatar(checked === "indeterminate" ? true : checked)
                    }
                  />
                  <label
                    htmlFor="withAvatar"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    With Avatar
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      <Card className="flex-1 lg:sticky lg:top-6 lg:self-start">
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <DisplayIdentity
            identity={selectedIdentity}
            namespaceId={selectedNamespaceId}
            withLink={withLink}
            withTooltip={withTooltip}
            withAvatar={withAvatar}
          />
        </CardContent>
      </Card>
    </section>
  );
}
