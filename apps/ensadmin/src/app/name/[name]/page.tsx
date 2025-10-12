"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "next/navigation";

import { useENSAdminProfile } from "@/hooks/use-ensadmin-profile";
import { AdditionalRecords } from "./_components/AdditionalRecords";
import { Addresses } from "./_components/Addresses";
import { NameDetailPageSkeleton } from "./_components/NameDetailPageSkeleton";
import { ProfileHeader } from "./_components/ProfileHeader";
import { ProfileInformation } from "./_components/ProfileInformation";
import { SocialLinks } from "./_components/SocialLinks";

export default function NameDetailPage() {
  const { name } = useParams<{ name: string }>();

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
