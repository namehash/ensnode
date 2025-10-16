"use client";

import { EnsAvatar } from "@/components/ens-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useAvatarUrl } from "@ensnode/ensnode-react";
import { Name } from "@ensnode/ensnode-sdk";
import { AlertCircle, Check, X } from "lucide-react";
import { useState } from "react";

const TEST_NAMES: Name[] = [
  "lightwalker.eth",
  "brantly.eth",
  "ada.eth",
  "nick.eth",
  "7⃣7⃣7⃣.eth",
  "jesse.base.eth",
  "000.eth",
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

  const namespaceId = useActiveNamespace();

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
          <EnsAvatar name={name} namespaceId={namespaceId} className="h-32 w-32" />
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
