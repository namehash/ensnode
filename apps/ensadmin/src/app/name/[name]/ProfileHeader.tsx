"use client";

import { ExternalLinkWithIcon } from "@/components/identity/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileHeaderProps {
  name: string;
  avatarUrl: URL | null;
  headerImage?: string | null;
  websiteUrl?: string | null;
}

export function ProfileHeader({ name, avatarUrl, headerImage, websiteUrl }: ProfileHeaderProps) {
  return (
    <Card className="overflow-hidden mb-8">
      <div
        className="h-48 bg-blue-500"
        style={{
          backgroundImage: `url(${headerImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="-mt-16 h-20 w-20 ring-4 ring-white">
              {avatarUrl && <AvatarImage src={avatarUrl.toString()} alt={name} />}
              <AvatarFallback className="text-2xl" randomAvatarGenerationSeed={name}>
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {websiteUrl && (
                  <ExternalLinkWithIcon
                    href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                    className="text-sm"
                  >
                    {websiteUrl.replace(/^https?:\/\//, "")}
                  </ExternalLinkWithIcon>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
