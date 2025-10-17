"use client";

import { EnsAvatar, EnsAvatarDisplay } from "@/components/ens-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { resolveAvatarUrl, useAvatarUrl } from "@ensnode/ensnode-react";
import { Name } from "@ensnode/ensnode-sdk";
import { AlertCircle, Check, X } from "lucide-react";
import { useMemo, useState } from "react";

const TEST_NAMES: Name[] = [
  "lightwalker.eth",
  "brantly.eth",
  "ada.eth",
  "jesse.base.eth",
  "norecordset.eth",
  "vitalik.eth",
];

interface AvatarTestCardProps {
  defaultName: Name;
}

function AvatarTestCard({ defaultName }: AvatarTestCardProps) {
  const [name, setName] = useState(defaultName);
  const { data, isLoading, error } = useAvatarUrl({ name });

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value as Name)}
              className="flex-1"
            />
          </CardTitle>
          <CardDescription className="text-red-600">Error loading avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value as Name)}
              className="w-full"
            />
          </CardTitle>
          <CardDescription>Loading avatar information...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-32 rounded-lg mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAvatar = data.browserSupportedAvatarUrl !== null;
  const hasRawUrl = data.rawAvatarUrl !== null;

  return (
    <Card className={hasAvatar ? "border-green-200" : "border-gray-200"}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {hasAvatar ? (
            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value as Name)}
            className="flex-1"
          />
        </CardTitle>
        <CardDescription>{hasAvatar ? "Avatar available" : "No avatar available"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Display */}
        <div className="flex justify-center">
          <EnsAvatar name={name} className="h-32 w-32" />
        </div>

        {/* Avatar Details */}
        <div className="space-y-3">
          {/* Raw Avatar URL */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Raw Avatar URL:</span>
              {hasRawUrl ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
              {data.rawAvatarUrl || "Not set"}
            </div>
          </div>

          {/* Browser-Supported URL */}
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
              {data.browserSupportedAvatarUrl?.toString() || "Not available"}
            </div>
          </div>

          {/* Uses Proxy Indicator */}
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-sm font-medium">Uses Proxy:</span>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Wrapper component that resolves and renders an avatar using a custom URL.
 * Supports http/https and data: URLs directly.
 */
function CustomAvatarWrapper({ customUrl }: { customUrl: string }) {
  const testName = "custom-test.eth" as Name;
  const namespaceId = useActiveNamespace();

  // Resolve the avatar URL using the same logic as useAvatarUrl
  // This supports http/https and data: URLs directly
  const resolvedData = useMemo(() => {
    return resolveAvatarUrl(customUrl, testName, namespaceId);
  }, [customUrl, testName, namespaceId]);

  const hasAvatar = resolvedData.browserSupportedAvatarUrl !== null;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <EnsAvatarDisplay
          name={testName}
          avatarUrl={resolvedData.browserSupportedAvatarUrl}
          className="h-32 w-32"
        />
      </div>

      {/* Display the resolution information */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Raw Avatar URL:</span>
            {resolvedData.rawAvatarUrl ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
            {resolvedData.rawAvatarUrl || "Not set"}
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
            {resolvedData.browserSupportedAvatarUrl?.toString() || "Not available"}
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-muted rounded">
          <span className="text-sm font-medium">Uses Proxy:</span>
          <div className="flex items-center gap-2">
            {resolvedData.usesProxy ? (
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
        </div>
      </div>
    </div>
  );
}

function CustomAvatarUrlTestCard() {
  const [customUrl, setCustomUrl] = useState("");

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">Custom Avatar URL Test</CardTitle>
        <CardDescription>
          Enter a raw avatar URL to test resolution and display. Supports HTTP/HTTPS and data: URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Avatar URL</label>
          <Input
            type="text"
            placeholder="https://example.com/avatar.jpg or data:image/svg+xml,..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
        </div>

        {/* Avatar Display */}
        {customUrl && <CustomAvatarWrapper customUrl={customUrl} />}

        {!customUrl && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            Enter a URL above to see how it would be resolved and displayed.
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>HTTP/HTTPS URLs: e.g., https://example.com/avatar.jpg</li>
              <li>Data URLs: e.g., data:image/svg+xml,&lt;svg...&gt;&lt;/svg&gt;</li>
            </ul>
          </div>
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
                <AvatarTestCard key={name} defaultName={name} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
