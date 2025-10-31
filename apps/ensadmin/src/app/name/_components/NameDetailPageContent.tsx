"use client";

import { type Name } from "@ensnode/ensnode-sdk";

import { Card, CardContent } from "@/components/ui/card";
import { useENSAdminProfile } from "@/hooks/use-ensadmin-profile";

import { AdditionalRecords } from "./AdditionalRecords";
import { Addresses } from "./Addresses";
import { NameDetailPageSkeleton } from "./NameDetailPageSkeleton";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileInformation } from "./ProfileInformation";
import { SocialLinks } from "./SocialLinks";

interface NameDetailPageContentProps {
  name: Name;
}

export function NameDetailPageContent({ name }: NameDetailPageContentProps) {
  const { data: profile, status } = useENSAdminProfile({ name });

  if (status === "pending") return <NameDetailPageSkeleton />;

  if (status === "error")
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load profile information</p>
        </CardContent>
      </Card>
    );

  // TODO: Design and Implement Profile not found page
  if (!profile) return null;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ProfileHeader profile={profile} />
      <div className="grid gap-6">
        <ProfileInformation profile={profile} />
        <SocialLinks profile={profile} />
        <Addresses profile={profile} />
        <AdditionalRecords profile={profile} />
      </div>
    </div>
  );
}
