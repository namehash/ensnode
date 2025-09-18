"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useActiveENSNodeConfig } from "@/hooks/use-active-ensnode-config";
import { useRecords } from "@ensnode/ensnode-react";
import { DefaultRecordsSelection } from "@ensnode/ensnode-sdk";
import { useParams } from "next/navigation";
import { AdditionalRecords } from "./AdditionalRecords";
import { Addresses } from "./Addresses";
import { NameDetailPageSkeleton } from "./NameDetailPageSkeleton";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInformation } from "./ProfileInformation";
import { SocialLinks } from "./SocialLinks";

export default function NameDetailPage() {
  const { name } = useParams<{ name: string }>();
  const { namespace } = useActiveENSNodeConfig();

  const { data: records, status } = useRecords({
    name,
    selection: DefaultRecordsSelection[namespace],
  });

  if (status === "pending") return <NameDetailPageSkeleton />;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ProfileHeader
        name={name}
        headerImage={records?.records?.texts?.header}
        websiteUrl={records?.records?.texts?.url}
      />

      <div className="grid gap-6">
        {status === "error" && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-600">Failed to load profile information</p>
            </CardContent>
          </Card>
        )}

        {status === "success" && (
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
