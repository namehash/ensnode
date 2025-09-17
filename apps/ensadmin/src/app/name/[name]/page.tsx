"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { useRecords } from "@ensnode/ensnode-react";
import { DefaultRecordsSelection } from "@ensnode/ensnode-sdk";
import { useParams } from "next/navigation";
import { AdditionalRecords } from "./_components/AdditionalRecords";
import { Addresses } from "./_components/Addresses";
import { ProfileHeader } from "./_components/ProfileHeader";
import { ProfileInformation } from "./_components/ProfileInformation";
import { NameDetailPageSkeleton, ProfileSkeleton } from "./_components/ProfileSkeleton";
import { SocialLinks } from "./_components/SocialLinks";

export default function NameDetailPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  // TODO: Get the namespace from the active ENSNode connection
  const namespaceId = ENSNamespaceIds.Mainnet;

  const {
    data,
    status: recordsStatus,
    isLoading,
  } = useRecords({
    name,
    selection: DefaultRecordsSelection[namespaceId],
  });

  const avatarUrl = getNameAvatarUrl(name, namespaceId);

  if (isLoading) {
    return <NameDetailPageSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ProfileHeader
        name={name}
        avatarUrl={avatarUrl}
        headerImage={data?.records?.texts?.header}
        websiteUrl={data?.records?.texts?.url}
      />

      <div className="grid gap-6">
        {recordsStatus === "pending" && <ProfileSkeleton />}

        {recordsStatus === "error" && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Failed to load profile information</p>
            </CardContent>
          </Card>
        )}

        {recordsStatus === "success" && data && (
          <>
            <ProfileInformation
              description={data.records.texts.description}
              email={data.records.texts.email}
            />

            <SocialLinks.Texts texts={data.records.texts} />

            <Addresses addresses={data.records.addresses} />

            <AdditionalRecords texts={data.records.texts} />
          </>
        )}
      </div>
    </div>
  );
}
