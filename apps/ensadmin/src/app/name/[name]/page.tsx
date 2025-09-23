"use client";

import { Card, CardContent } from "@/components/shadcn/card";
import { useRecords } from "@ensnode/ensnode-react";
import { ResolverRecordsSelection, getCommonCoinTypes } from "@ensnode/ensnode-sdk";
import { useParams } from "next/navigation";

import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { AdditionalRecords } from "./_components/AdditionalRecords";
import { Addresses } from "./_components/Addresses";
import { NameDetailPageSkeleton } from "./_components/NameDetailPageSkeleton";
import { ProfileHeader } from "./_components/ProfileHeader";
import { ProfileInformation } from "./_components/ProfileInformation";
import { SocialLinks } from "./_components/SocialLinks";

const HeaderPanelTextRecords = ["url", "avatar", "header"];
const ProfilePanelTextRecords = ["description", "email"];
const SocialLinksTextRecords = [
  "com.twitter",
  "com.github",
  "com.farcaster",
  "org.telegram",
  "com.linkedin",
  "com.reddit",
];
// TODO: Instead of explicitly listing AdditionalTextRecords, we should update
// `useRecords` so that we can ask it to return not only all the records we
// explicitly requested, but also any other records that were found onchain,
// no matter what their text record keys are. Below are two examples of
// additional text records set for lightwalker.eth on mainnet as an example.
// see: https://github.com/namehash/ensnode/issues/1083
const AdditionalTextRecords = ["status", "eth.ens.delegate"];
const AllRequestedTextRecords = [
  ...HeaderPanelTextRecords,
  ...ProfilePanelTextRecords,
  ...SocialLinksTextRecords,
  ...AdditionalTextRecords,
];

export default function NameDetailPage() {
  const { name } = useParams<{ name: string }>();
  const namespace = useActiveNamespace();

  const selection = {
    addresses: getCommonCoinTypes(namespace),
    texts: AllRequestedTextRecords,
  } as const satisfies ResolverRecordsSelection;

  // TODO: Each app (including ENSAdmin) should define their own "wrapper" data model around
  // their `useRecords` queries that is specific to their use case. For example, ENSAdmin should
  // define a nicely designed data model such as `ENSProfile` (based on the subjective definition
  // of what an ENS profile is within the context of ENSAdmin). Then, a hook such as `useENSProfile`
  // should be defined that internally calls `useRecords` and then performs the data transformations
  // that might be required to return the nice, clean, and specialized `ENSProfile` data model.
  // The code in `ProfileHeader`, `ProfileInformation`, `SocialLinks`, `Addresses`, and `AdditionalRecords`
  // should then be updated so that it takes as input only the nice and clean `ENSProfile` data model.
  // These UI components should not need to consider the nuances or complexities of the raw `useRecords`
  // data model. All those nuances and complexities should be mananaged in a single place (ex: `useENSProfile`).
  // see: https://github.com/namehash/ensnode/issues/1082
  const { data, status } = useRecords({
    name,
    selection,
  });

  if (status === "pending") return <NameDetailPageSkeleton />;

  if (status === "error")
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load profile information</p>
        </CardContent>
      </Card>
    );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <ProfileHeader
        name={name}
        headerImage={data?.records?.texts?.header}
        websiteUrl={data?.records?.texts?.url}
      />
      <div className="grid gap-6">
        <ProfileInformation
          description={data.records.texts.description}
          email={data.records.texts.email}
        />

        <SocialLinks.Texts texts={data.records.texts} />

        <Addresses addresses={data.records.addresses} />

        <AdditionalRecords texts={data.records.texts} />
      </div>
    </div>
  );
}
