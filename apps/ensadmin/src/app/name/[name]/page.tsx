"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ExternalLinkWithIcon } from "@/components/identity/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";
import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { useRecords } from "@ensnode/ensnode-react";
import { DefaultRecordsSelection } from "@ensnode/ensnode-sdk";
import { SiGithub, SiX } from "@icons-pack/react-simple-icons";
import { ExternalLink, Mail } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function NameDetailPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  // TODO: Get the namespace from the active ENSNode connection
  const namespaceId = ENSNamespaceIds.Mainnet;

  const {
    data: records,
    status: recordsStatus,
    isLoading,
  } = useRecords({
    name,
    selection: DefaultRecordsSelection.mainnet,
  });

  const avatarUrl = getNameAvatarUrl(name, namespaceId);

  const headerImage = records?.records?.texts?.header;

  if (isLoading) {
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
                    <ExternalLinkWithIcon
                      href={
                        records.records.texts.url.startsWith("http")
                          ? records.records.texts.url
                          : `https://${records.records.texts.url}`
                      }
                      className="text-sm"
                    >
                      {records.records.texts.url.replace(/^https?:\/\//, "")}
                    </ExternalLinkWithIcon>
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

            {(records.records.texts?.["com.twitter"] || records.records.texts?.["com.github"]) && (
              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {records.records.texts?.["com.twitter"] && (
                    <div className="flex items-center gap-2">
                      <SiX size={16} className="text-gray-500" />
                      <ExternalLinkWithIcon
                        href={`https://twitter.com/${records.records.texts["com.twitter"]}`}
                        className="text-sm"
                      >
                        @{records.records.texts["com.twitter"]}
                      </ExternalLinkWithIcon>
                    </div>
                  )}

                  {records.records.texts?.["com.github"] && (
                    <div className="flex items-center gap-2">
                      <SiGithub size={16} className="text-gray-500" />
                      <ExternalLinkWithIcon
                        href={`https://github.com/${records.records.texts["com.github"]}`}
                        className="text-sm"
                      >
                        {records.records.texts["com.github"]}
                      </ExternalLinkWithIcon>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
