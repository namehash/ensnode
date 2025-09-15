"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { useRecords } from "@ensnode/ensnode-react";
import { DefaultRecordsSelection } from "@ensnode/ensnode-sdk";
import { useParams } from "next/navigation";
import { AdditionalRecords } from "./AdditionalRecords";
import { Addresses } from "./Addresses";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInformation } from "./ProfileInformation";
import { NameDetailPageSkeleton, ProfileSkeleton } from "./ProfileSkeleton";
import { SocialLinks } from "./SocialLinks";

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

  if (isLoading) {
    return <NameDetailPageSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ProfileHeader
        name={name}
        avatarUrl={avatarUrl}
        headerImage={records?.records?.texts?.header}
        websiteUrl={records?.records?.texts?.url}
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

        {recordsStatus === "success" && records && (
          <>
            <ProfileInformation
              description={records.records.texts?.description}
              email={records.records.texts?.email}
            />

            <SocialLinks
              twitter={records.records.texts?.["com.twitter"]}
              github={records.records.texts?.["com.github"]}
              farcaster={records.records.texts?.["com.farcaster"]}
              telegram={records.records.texts?.["org.telegram"]}
              linkedin={records.records.texts?.["com.linkedin"]}
              reddit={records.records.texts?.["com.reddit"]}
            />

            <Addresses addresses={records.records.addresses} />

            <AdditionalRecords texts={records.records.texts} />
          </>
        )}
      </div>
    </div>
  );
}
