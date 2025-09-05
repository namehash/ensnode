"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { useRecords } from "@ensnode/ensnode-react";
import { DefaultRecordsSelection } from "@ensnode/ensnode-sdk";
import { ExternalLink, Mail, Twitter } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NameDetailPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // TODO: Get the namespace from the active ENSNode connection
  const namespaceId = ENSNamespaceIds.Mainnet;

  const { data: records, status: recordsStatus } = useRecords({
    name,
    selection: DefaultRecordsSelection.mainnet,
  });

  const avatarUrl = getNameAvatarUrl(name, namespaceId);

  const headerImage = records?.records?.texts?.header;

  if (!mounted) {
    return <NameDetailPageSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header Section */}
      <Card className="overflow-hidden mb-8">
        {/* Header background (only if header image exists) */}
        {headerImage && (
          <div
            className="h-48 bg-gray-200"
            style={{
              backgroundImage: `url(${headerImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}

        {/* Content */}
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className={`h-20 w-20 ring-4 ring-white ${headerImage ? "-mt-16" : ""}`}>
                {avatarUrl && <AvatarImage src={avatarUrl.toString()} alt={name} />}
                <AvatarFallback className="text-2xl" randomAvatarGenerationSeed={name}>
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  {records?.records?.texts?.url && (
                    <a
                      href={
                        records.records.texts.url.startsWith("http")
                          ? records.records.texts.url
                          : `https://${records.records.texts.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {records.records.texts.url.replace(/^https?:\/\//, "")}
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <div className="grid gap-6">
        {recordsStatus === "pending" && <ProfileSkeleton />}

        {recordsStatus === "error" && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Failed to load profile information</p>
            </CardContent>
          </Card>
        )}

        {recordsStatus === "success" && records && (
          <>
            {/* Basic Information */}
            {(records.records.texts?.description || records.records.texts?.email) && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {records.records.texts?.description && (
                    <div>
                      <h3 className="font-medium text-sm text-gray-500 mb-1">Description</h3>
                      <p className="text-sm">{records.records.texts.description}</p>
                    </div>
                  )}

                  {records.records.texts?.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <a
                        href={`mailto:${records.records.texts.email}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {records.records.texts.email}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            {(records.records.texts?.["com.twitter"] || records.records.texts?.["com.github"]) && (
              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {records.records.texts?.["com.twitter"] && (
                    <div className="flex items-center gap-2">
                      <Twitter size={16} className="text-gray-500" />
                      <a
                        href={`https://twitter.com/${records.records.texts["com.twitter"]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        @{records.records.texts["com.twitter"]}
                      </a>
                    </div>
                  )}

                  {records.records.texts?.["com.github"] && (
                    <div className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-gray-500"
                      >
                        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                      <a
                        href={`https://github.com/${records.records.texts["com.github"]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {records.records.texts["com.github"]}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Addresses */}
            {records.records.addresses && Object.keys(records.records.addresses).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(records.records.addresses).map(([coinType, address]) => (
                    <div key={coinType} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        Coin Type {coinType}
                      </span>
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {String(address)}
                      </code>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Additional Text Records */}
            {records.records.texts &&
              Object.keys(records.records.texts).some(
                (key) =>
                  ![
                    "description",
                    "url",
                    "email",
                    "com.twitter",
                    "com.github",
                    "avatar",
                    "header",
                    "name",
                  ].includes(key),
              ) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Records</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(records.records.texts)
                      .filter(
                        ([key]) =>
                          ![
                            "description",
                            "url",
                            "email",
                            "com.twitter",
                            "com.github",
                            "avatar",
                            "header",
                            "name",
                          ].includes(key),
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between">
                          <span className="text-sm font-medium text-gray-500 min-w-0 flex-1">
                            {key}
                          </span>
                          <span className="text-sm text-gray-900 ml-4 break-all">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
          </>
        )}
      </div>
    </div>
  );
}

function NameDetailPageSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>
      </div>

      <ProfileSkeleton />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
