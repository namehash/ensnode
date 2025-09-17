"use client";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { NameDisplay } from "@/components/identity/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { beautifyUrl } from "@/lib/beautify-url";

interface ProfileHeaderProps {
  name: string;
  avatarUrl: URL | null;
  headerImage?: string | null;
  websiteUrl?: string | null;
}

export function ProfileHeader({ name, avatarUrl, headerImage, websiteUrl }: ProfileHeaderProps) {
  // Parse header image URI and only use it if it's HTTP/HTTPS
  // TODO: Add support for more URI types as defined in ENSIP-12
  // See: https://docs.ens.domains/ensip/12#uri-types
  const getValidHeaderImageUrl = (headerImage: string | null | undefined): string | null => {
    if (!headerImage) return null;

    let url: URL;
    try {
      url = new URL(headerImage);
    } catch {
      return null;
    }

    if (url.protocol === "http:" || url.protocol === "https:") return headerImage;

    // For any other URI types (ipfs, data, NFT URIs, etc.), fallback to default
    return null;
  };

  const normalizeWebsiteUrl = (url: string | null | undefined): URL | null => {
    if (!url) return null;

    try {
      try {
        return new URL(url);
      } catch {
        return new URL(`https://${url}`);
      }
    } catch {
      return null;
    }
  };

  const validHeaderImageUrl = getValidHeaderImageUrl(headerImage);
  const normalizedWebsiteUrl = normalizeWebsiteUrl(websiteUrl);

  return (
    <Card className="overflow-hidden mb-8">
      <div
        className="h-48 bg-blue-500"
        style={{
          backgroundImage: validHeaderImageUrl ? `url(${validHeaderImageUrl})` : undefined,
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
              <AvatarFallback randomAvatarGenerationSeed={name} />
            </Avatar>
            <div className="flex-1">
              <h1>
                <NameDisplay className="text-3xl font-bold" name={name} />
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {normalizedWebsiteUrl && (
                  <ExternalLinkWithIcon href={normalizedWebsiteUrl.toString()} className="text-sm">
                    {beautifyUrl(normalizedWebsiteUrl)}
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
