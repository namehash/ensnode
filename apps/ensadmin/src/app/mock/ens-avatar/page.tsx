"use client";

import { AlertCircle, Check, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ENSNamespaceIds } from "@ensnode/datasources";
import { useAvatarUrl } from "@ensnode/ensnode-react";
import { buildBrowserSupportedAvatarUrl, ENSNamespaceId, Name } from "@ensnode/ensnode-sdk";

import { EnsAvatar, EnsAvatarDisplay } from "@/components/ens-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const TEST_NAMES: Name[] = [
  "lightwalker.eth",
  "brantly.eth",
  "ada.eth",
  "jesse.base.eth",
  "skeleton.mfpurrs.eth",
  "vitalik.eth",
];

interface AvatarTestCardProps {
  name: Name;
}

function AvatarTestCard({ name }: AvatarTestCardProps) {
  const { data, isLoading, error } = useAvatarUrl({ name });

  const hasAvatar = data?.browserSupportedAvatarUrl !== null;
  const hasRawUrl = data?.rawAvatarTextRecord !== null;
  const hasError = !!error;

  return (
    <Card
      className={hasError ? "border-red-200" : hasAvatar ? "border-green-200" : "border-gray-200"}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {hasError ? (
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          ) : hasAvatar ? (
            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
          <span>{name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <EnsAvatar name={name} className="h-32 w-32" />
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Raw Avatar URL:</span>
              {isLoading ? null : hasRawUrl ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            {isLoading || !data ? (
              <Skeleton className="h-8 w-full rounded" />
            ) : (
              <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                {data.rawAvatarTextRecord || "Not set"}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Browser-Supported URL:</span>
              {isLoading ? null : hasAvatar ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            {isLoading || !data ? (
              <Skeleton className="h-8 w-full rounded" />
            ) : (
              <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                {data.browserSupportedAvatarUrl?.toString() || "Not available"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-sm font-medium">Uses Proxy:</span>
            {isLoading || !data ? (
              <Skeleton className="h-4 w-12 rounded" />
            ) : (
              <div className="flex items-center gap-2">
                {data.usesProxy ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Yes</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">No</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Wrapper component that resolves and renders an avatar using a custom raw avatar text record.
 * Does not make any requests - only uses the provided inputs for resolution.
 */
function CustomAvatarWrapper({
  rawAssetTextRecord,
  name,
  namespaceId,
}: {
  rawAssetTextRecord: string;
  name: Name;
  namespaceId: ENSNamespaceId;
}) {
  // Resolve the avatar URL using the same logic as useAvatarUrl
  // This does NOT make any network requests - it only processes the provided raw text record
  const resolvedData = useMemo(() => {
    return buildBrowserSupportedAvatarUrl(rawAssetTextRecord, name, namespaceId);
  }, [rawAssetTextRecord, name, namespaceId]);

  const hasAvatar = resolvedData.browserSupportedAssetUrl !== null;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <EnsAvatarDisplay
          name={name}
          avatarUrl={resolvedData.browserSupportedAssetUrl}
          className="h-32 w-32"
        />
      </div>

      {/* Display the resolution information */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Raw Avatar Text Record:</span>
            {resolvedData.rawAssetTextRecord ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
            {resolvedData.rawAssetTextRecord || "Not set"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Browser-Supported URL:</span>
            {hasAvatar ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
            {resolvedData.browserSupportedAssetUrl?.toString() || "Not available"}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomAvatarUrlTestCard() {
  const [namespaceId, setNamespaceId] = useState<ENSNamespaceId>(ENSNamespaceIds.Mainnet);
  const [name, setName] = useState<Name>("" as Name);
  const [rawAssetTextRecord, setRawAssetTextRecord] = useState("");

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">Custom Avatar Text Record</CardTitle>
        <CardDescription>
          Enter an ENS namespace, name, and raw avatar text record to test resolution and display.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Namespace Selection */}
        <div className="space-y-2">
          <Label htmlFor="namespace">ENS Namespace</Label>
          <Select
            value={namespaceId}
            onValueChange={(value) => setNamespaceId(value as ENSNamespaceId)}
          >
            <SelectTrigger id="namespace">
              <SelectValue placeholder="Select namespace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ENSNamespaceIds.Mainnet}>Mainnet</SelectItem>
              <SelectItem value={ENSNamespaceIds.Sepolia}>Sepolia</SelectItem>
              <SelectItem value={ENSNamespaceIds.Holesky}>Holesky</SelectItem>
              <SelectItem value={ENSNamespaceIds.EnsTestEnv}>ENS Test Env</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Name Input */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="vitalik.eth"
            value={name}
            onChange={(e) => setName(e.target.value as Name)}
          />
        </div>

        {/* Avatar URL Input */}
        <div className="space-y-2">
          <Label htmlFor="avatar-url">Raw Avatar Text Record</Label>
          <Input
            id="avatar-url"
            type="text"
            placeholder="https://example.com/avatar.jpg, ipfs://..., eip155:1/erc721:..., etc."
            value={rawAssetTextRecord}
            onChange={(e) => setRawAssetTextRecord(e.target.value)}
          />
        </div>

        {/* Avatar Display */}
        {rawAssetTextRecord && name && (
          <CustomAvatarWrapper
            rawAssetTextRecord={rawAssetTextRecord}
            name={name}
            namespaceId={namespaceId}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function MockAvatarUrlPage() {
  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Mock: ENS Avatar</CardTitle>
          <CardDescription>
            Displays avatar images, raw URLs, browser-supported URLs, and proxy usage for each ENS
            name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Custom URL Test Section */}
            <CustomAvatarUrlTestCard />

            {/* Existing Test Names Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEST_NAMES.map((name) => (
                <AvatarTestCard key={name} name={name} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
