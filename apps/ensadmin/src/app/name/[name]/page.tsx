"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useNamespaceId } from "@/hooks/useNamespaceId";
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

  const { data: namespaceId, isLoading: namespaceLoading } = useNamespaceId();

  const {
    data: records,
    status: recordsStatus,
    isLoading: recordsLoading,
  } = useRecords({
    name,
    selection: DefaultRecordsSelection[namespaceId],
  });

  if (namespaceLoading || recordsLoading) {
    return <NameDetailPageSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ProfileHeader
        name={name}
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
            />

            <Addresses addresses={records.records.addresses} />

            <AdditionalRecords texts={records.records.texts} />
          </>
        )}
      </div>
    </div>
  );
}
